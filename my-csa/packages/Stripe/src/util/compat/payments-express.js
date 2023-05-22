/**
 * Stripe compatibility for ScandiPWA
 * @copyright Scandiweb, Inc. All rights reserved.
 */

import getStore from 'SourceUtil/Store';
import { fetchMutation, fetchQuery, getErrorMessage } from 'Util/Request';
import { appendWithStoreCode } from 'Util/Url';

import StripeApplePayConfigQuery from '../../query/StripeApplePayConfig.query';
import StripeApplyShippingMutation from '../../query/StripeApplyShipping.mutation';
import StripeEstimateShippingMutation from '../../query/StripeEstimateShipping.mutation';
import StripePlaceOrderMutation from '../../query/StripePlaceOrder.mutation';
import { waitForCallback } from '../wait';
import { Payments } from './payments';

/**
 * NOTE: This file is intended to stay compatible
 * with view/frontend/web/js/stripe_payments_express.js file
 */

export const STRIPE_EXPRESS_CART_TYPE = 'cart';
export const STRIPE_EXPRESS_MINICART_TYPE = 'minicart';
export const STRIPE_EXPRESS_PRODUCT_TYPE = 'product';
export const STRIPE_EXPRESS_CHECKOUT_TYPE = 'checkout';

/** @namespace Scandiweb/Stripe/Util/Compat/PaymentsExpress/getApplePayParams */
export const getApplePayParams = async (type) => {
    const { stripeApplePayConfig } = await fetchQuery(
        StripeApplePayConfigQuery.getStripeApplePayConfigField({
            type
        })
    );

    // vvv Fix the Boolean type on pending field
    stripeApplePayConfig.total.pending = !!stripeApplePayConfig.total.pending;
    stripeApplePayConfig.displayItems.forEach(({ pending }, i) => {
        stripeApplePayConfig.displayItems[i].pending = !!pending;
    });

    return stripeApplePayConfig;
};

/** @namespace Scandiweb/Stripe/Util/Compat/PaymentsExpress/estimateShipping */
export const estimateShipping = async (address) => {
    const { stripeEstimateShipping } = await fetchMutation(
        StripeEstimateShippingMutation.getStripeEstimateShippingField({
            address
        })
    );

    return stripeEstimateShipping;
};

/** @namespace Scandiweb/Stripe/Util/Compat/PaymentsExpress/applyShipping */
export const applyShipping = async (address, shippingOptionId) => {
    const { stripeApplyShipping } = await fetchMutation(
        StripeApplyShippingMutation.getStripeApplyShippingField({
            shippingOptionId,
            address
        })
    );

    // vvv Fix the Boolean type on pending field
    stripeApplyShipping.total.pending = !!stripeApplyShipping.total.pending;
    stripeApplyShipping.displayItems.forEach(({ pending }, i) => {
        stripeApplyShipping.displayItems[i].pending = !!pending;
    });

    return stripeApplyShipping;
};

/** @namespace Scandiweb/Stripe/Util/Compat/PaymentsExpress/processAddress */
export const processAddress = (oldAddress) => {
    const address = JSON.parse(JSON.stringify(oldAddress));
    const { city, region, country } = address;

    if (!city && region) {
        address.city = region;
    }

    const getLatinOnlyString = (str) => (str
        ? str.normalize('NFD').replace(/[\u0300-\u036f]/g, '')
        : undefined
    );

    const { countries } = getStore().getState().ConfigReducer;
    const countryObject = countries.find(({ id }) => id === country);

    if (!countryObject) {
        return address;
    }

    const regionObject = countryObject.available_regions && countryObject.available_regions.find(
        ({ name }) => {
            const latinRegion = getLatinOnlyString(name);

            return (
                latinRegion.includes(getLatinOnlyString(city))
                || latinRegion.includes(getLatinOnlyString(region))
            );
        }
    );

    if (!regionObject) {
        return address;
    }

    // vvv We need exact value, as Stripe does not account for latin chars
    address.region = regionObject.name;

    return address;
};

/** @namespace Scandiweb/Stripe/Util/Compat/PaymentsExpress/processBillingAddress */
export const processBillingAddress = (address) => {
    const { region, ...rest } = processAddress(address);

    return {
        ...rest,
        // vvv Stripe uses "state" field conversion of billing
        state: region
    };
};

/** @namespace Scandiweb/Stripe/Util/Compat/PaymentsExpress/getStripeParamsType */
export const getStripeParamsType = async (type, productId) => {
    if (type !== STRIPE_EXPRESS_PRODUCT_TYPE) {
        return type;
    }

    // vvv Add :id postfix to product type
    return `${type}:${productId}`;
};

/** @namespace Scandiweb/Stripe/Util/Compat/PaymentsExpress/initStripeExpress */
export const initStripeExpress = async ({
    elementId,
    wrapperId,
    type,
    addToCart = () => {},
    productId = 0
}) => {
    const element = document.getElementById(elementId);

    const hideButton = () => {
        element.style.display = 'none';

        if (wrapperId) {
            const wrapper = document.getElementById(wrapperId);

            if (wrapper) {
                wrapper.style.display = 'none';
            }
        }
    };

    try {
        // vvv Wait for cart id
        await waitForCallback(() => getStore().getState().CartReducer?.cartTotals?.id);
        const paramsType = await getStripeParamsType(type, productId);
        const params = await getApplePayParams(paramsType);

        if (
            !element
            || (
                params.total.amount === 0
                && params.displayItems.length === 0
            )
        ) {
            return;
        }

        if (!params.country) {
            // eslint-disable-next-line max-len
            throw new Error('Cannot display Wallet Button because there is no Country Code. You can set a default one from Magento Admin > Stores > Configuration > General > Country Options > Default Country.');
        }

        const stripe = new Payments();
        await stripe.init();

        await waitForCallback(() => getStore().getState().ConfigReducer?.stripeConfig?.buttonConfig);
        const settings = await getStore().getState().ConfigReducer?.stripeConfig?.buttonConfig;

        stripe.paymentRequest = stripe.stripeJs.paymentRequest(params);

        const { locale } = await stripe.getConfig();
        const elements = stripe.stripeJs.elements({ locale });

        const prButton = elements.create('paymentRequestButton', {
            paymentRequest: stripe.paymentRequest,
            style: {
                paymentRequestButton: settings
            }
        });

        const isPaymentAvailable = await stripe.paymentRequest.canMakePayment();
        stripe.canMakePaymentResult = isPaymentAvailable;

        if (!isPaymentAvailable) {
            // vvv Hide button
            hideButton();
            return;
        }

        prButton.mount(`#${elementId}`);

        const typeHandlers = {
            [STRIPE_EXPRESS_CART_TYPE]: async () => {},
            [STRIPE_EXPRESS_MINICART_TYPE]: async () => {},
            [STRIPE_EXPRESS_PRODUCT_TYPE]: async () => {
                prButton.on('click', async () => {
                    await addToCart();
                });
            }
        };

        // vvv Need to use our type
        const handler = typeHandlers[type];

        if (handler) {
            await handler();
        }

        stripe.paymentRequest.on('shippingaddresschange', async (ev) => {
            const { shippingAddress: rawAddress } = ev;
            const shippingAddress = processAddress(rawAddress);

            // vvv Save shipping address for later
            stripe.shippingAddress = shippingAddress;

            const shippingOptions = await estimateShipping(shippingAddress);

            if (shippingOptions.length < 1) {
                ev.updateWith({ status: 'invalid_shipping_address' });
                return;
            }

            // vvv Get first shipping method (must have id)
            const [{ id }] = shippingOptions;
            const totals = await applyShipping(shippingAddress, id);

            ev.updateWith({
                status: 'success',
                shippingOptions,
                ...totals
            });
        });

        stripe.paymentRequest.on('shippingoptionchange', async (ev) => {
            if (!stripe.shippingAddress) {
                return;
            }

            const { shippingOption } = ev;
            const { id } = shippingOption;

            try {
                const totals = await applyShipping(stripe.shippingAddress, id);

                ev.updateWith({
                    status: 'success',
                    ...totals
                });
            } catch (e) {
                ev.updateWith({ status: 'fail' });
            }
        });

        stripe.paymentRequest.on('paymentmethod', async (ev) => {
            stripe.PRAPIEvent = ev;

            try {
                // element.classList.add('disabled');

                const placeOrder = async (isFirstTime = true) => {
                    const paymentDetails = JSON.parse(JSON.stringify(ev));

                    if (paymentDetails.shippingAddress) {
                        // ^^^ Shipping might not be set
                        paymentDetails.shippingAddress = processAddress(paymentDetails.shippingAddress);
                    }

                    paymentDetails.paymentMethod.billing_details.address = processBillingAddress(
                        paymentDetails.paymentMethod.billing_details.address
                    );

                    try {
                        const { stripePlaceOrder } = await fetchMutation(
                            StripePlaceOrderMutation.getPlaceOrderField({
                                rawPaymentDetails: JSON.stringify(paymentDetails),
                                type: paramsType
                            })
                        );

                        const { orderId } = stripePlaceOrder;

                        if (orderId) {
                            return orderId;
                        }

                        throw new Error('Can not place order for unknown reason.');
                    } catch (e) {
                        const message = getErrorMessage(e);
                        const isAuthenticationRequired = await stripe.isAuthenticationRequired(message);

                        if (!isAuthenticationRequired && !isFirstTime) {
                            // ^^^ I added cehck for isFirstTime to avoid infite loop
                            throw new Error(message);
                        }

                        await stripe.processNextAuthentication();
                        return placeOrder(false);
                    }
                };

                const orderId = await placeOrder();

                // vvv Rely on checkout for cart invalidation
                window.location = appendWithStoreCode(`/checkout/success?orderId=${orderId}`);
            } catch (e) {
                // element.classList.remove('disabled');
                console.log(e);
            }
        });
    } catch (e) {
        hideButton();

        console.log(e);

        // if (e.message) {
        //     getStore().dispatch(showNotification('error', e.message));
        // }
    }
};
