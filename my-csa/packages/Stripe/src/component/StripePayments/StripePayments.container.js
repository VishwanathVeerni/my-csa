/**
 * Stripe compatibility for ScandiPWA
 * @copyright Scandiweb, Inc. All rights reserved.
 */

import PropTypes from 'prop-types';
import { PureComponent } from 'react';
import { connect } from 'react-redux';

// vvv Using to wait for store value
import getStore from 'SourceUtil/Store';
import { showNotification } from 'Store/Notification/Notification.action';
import { fetchQuery } from 'Util/Request';

import StripePaymentsConfigQuery from '../../query/StripePaymentsConfig.query';
import { Payments } from '../../util/compat/payments';
import { waitForCallback } from '../../util/wait';
import StripePayments from './StripePayments.component';
import {
    STRIPE_AUTHORIZATION_ERROR_CODE,
    STRIPE_BILLING_SUBMIT_EVENT,
    STRIPE_CONFIRMATION_FAILED_EVENT,
    STRIPE_METHOD_ACSS_DEBIT,
    STRIPE_METHOD_BOLETO,
    STRIPE_METHOD_CARD,
    STRIPE_METHOD_SEPA_DEBIT,
    STRIPE_METHOD_US_BANK_ACCOUNT,
    STRIPE_NEW_PAYMENT_METHOD,
    STRIPE_ORDER_PLACED_EVENT,
    STRIPE_PAYMENTS_ELEMENT_ID
} from './StripePayments.config';

/** @namespace Scandiweb/Stripe/Component/StripePayments/Container/mapStateToProps */
export const mapStateToProps = () => ({});

/** @namespace Scandiweb/Stripe/Component/StripePayments/Container/mapDispatchToProps */
export const mapDispatchToProps = (dispatch) => ({
    showErrorNotification: (message) => dispatch(showNotification('error', message))
});

/** @namespace Scandiweb/Stripe/Component/StripePayments/Container */
export class StripePaymentsContainer extends PureComponent {
    static propTypes = {
        showErrorNotification: PropTypes.func.isRequired
    };

    state = {
        currentDropdownValue: STRIPE_NEW_PAYMENT_METHOD,
        paymentsConfig: { savedMethods: [] },
        isFormComplete: false,
        isCurrentlyLoading: false
    };

    containerFunctions = {
        setCurrentDropdownValue: this.setCurrentDropdownValue.bind(this)
    };

    componentDidMount() {
        document.addEventListener(STRIPE_BILLING_SUBMIT_EVENT, this.onBillingSubmit);
        document.addEventListener(STRIPE_ORDER_PLACED_EVENT, this.onOrderPlaced);
    }

    componentDidUpdate(_, prevState) {
        const { currentDropdownValue } = this.state;
        const { currentDropdownValue: prevDropdownValue } = prevState;

        if (
            currentDropdownValue !== prevDropdownValue
            && currentDropdownValue === STRIPE_NEW_PAYMENT_METHOD
            // ^^^ aka. "isPaymentFormVisible" changed
        ) {
            this.initPaymentForm();
        }
    }

    componentWillUnmount() {
        document.removeEventListener(STRIPE_BILLING_SUBMIT_EVENT, this.onBillingSubmit);
        document.removeEventListener(STRIPE_ORDER_PLACED_EVENT, this.onOrderPlaced);
    }

    initPaymentForm = async () => {
        const { paymentsConfig: { clientSecret } } = this.state;

        if (!clientSecret) {
            // ^^^ Skip this init call
            return;
        }

        this.setState({ isFormComplete: false });
        // ^^^ Reset payment form status on init

        // ^^^ Init stripe if not saved
        this.stripe = new Payments();
        await this.stripe.init();

        // ^^^ Init elements if not saved
        const { locale } = await this.stripe.getConfig();
        this.elements = this.stripe.stripeJs.elements({
            locale,
            clientSecret
        });

        const pElementOptions = {
            // vvv Original extension disabled wallets only if express checkout was disabled
            //     we disabled them, because of "Please fill in your card details." error
            wallets: {
                applePay: 'never',
                googlePay: 'never'
            }
            // TODO: handle fields (what to collect?)
            // ^^^ Tried, very difficult due to billing address being not controlled
        };

        // vvv Passing no options, original extensions passes some address fields
        const pElement = this.elements.create('payment', pElementOptions);
        pElement.mount(`#${STRIPE_PAYMENTS_ELEMENT_ID}`);
        pElement.on('change', ({ complete }) => {
            this.setState({ isFormComplete: !!complete });
        });
    };

    onBillingSubmit = async () => {
        const { showErrorNotification } = this.props;

        const {
            isFormComplete,
            currentDropdownValue,
            paymentsConfig: { savedMethods }
        } = this.state;

        try {
            if (!isFormComplete && currentDropdownValue === STRIPE_NEW_PAYMENT_METHOD) {
                throw new Error(__('Please complete your payment details.'));
            }

            // TODO: validate CVC (agreement is handled automatically)

            this.setState({ isCurrentlyLoading: true });

            if (currentDropdownValue === STRIPE_NEW_PAYMENT_METHOD) {
                window.stripeData = {
                    cc_stripejs_token: 'never',
                    // ^^^ this value is required by GraphQl
                    client_side_confirmation: true,
                    payment_method: null
                };

                return;
            }

            const { value } = savedMethods.find(({ fingerprint }) => (
                fingerprint === currentDropdownValue
            )) || {};

            if (!value) {
                throw new Error(__('Can not proceed with selected payment method.'));
            }

            window.stripeData = {
                cc_stripejs_token: 'never',
                // ^^^ this value is required by GraphQl
                client_side_confirmation: true,
                payment_method: value
            };
        } catch (e) {
            this.setState({ isCurrentlyLoading: false });
            showErrorNotification(e.message);
        }
    };

    onOrderPlaced = async (ev) => {
        const { detail: { orderId } } = ev;
        const {
            paymentsConfig: {
                clientSecret,
                successUrl,
                savedMethods
            },
            currentDropdownValue
        } = this.state;

        try {
            if (!orderId) {
                // eslint-disable-next-line max-len
                throw new Error(__('The order was placed but the response from the server did not include a numeric order ID.'));
            }

            if (!this.stripe) {
                // vvv Init stripe if not avilable
                this.stripe = new Payments();
                await this.stripe.init();
            }

            // vvv TODO: investigate when client secret is setup in checkout ?
            const isSetup = clientSecret.indexOf('seti_') === 0;

            // TODO: add CVC code to confirm params

            const confirmPayment = () => {
                if (currentDropdownValue === STRIPE_NEW_PAYMENT_METHOD) {
                    const confirmParams = {
                        elements: this.elements,
                        confirmParams: {
                            return_url: successUrl
                        }
                    };

                    if (window.stripeBillingAddress) {
                        const {
                            city,
                            country_code,
                            firstname,
                            lastname,
                            postcode,
                            region,
                            street,
                            telephone
                        } = window.stripeBillingAddress;

                        confirmParams.confirmParams.payment_method_data = {
                            billing_details: {
                                address: {
                                    city,
                                    country: country_code,
                                    line1: street[0],
                                    line2: street[1],
                                    postal_code: postcode,
                                    state: region
                                },
                                name: `${firstname} ${lastname}`,
                                phone: telephone
                                // email:
                            }
                        };
                    }

                    if (isSetup) {
                        return this.stripe.stripeJs.confirmSetup(confirmParams);
                    }

                    return this.stripe.stripeJs.confirmPayment(confirmParams);
                }

                const { value, type } = savedMethods.find(({ fingerprint }) => (
                    fingerprint === currentDropdownValue
                )) || {};

                const confirmParams = {
                    return_url: successUrl,
                    payment_method: value || STRIPE_NEW_PAYMENT_METHOD
                    // ^^^ According to Stripe docs this must be an object,
                    //     extension passes a string here, copying that
                };

                switch (type) {
                case STRIPE_METHOD_CARD:
                    if (isSetup) {
                        return this.stripe.stripeJs.confirmCardSetup(clientSecret, confirmParams);
                    }

                    return this.stripe.stripeJs.confirmCardPayment(clientSecret, confirmParams);
                case STRIPE_METHOD_SEPA_DEBIT:
                    if (isSetup) {
                        return this.stripe.stripeJs.confirmSepaDebitSetup(clientSecret, confirmParams);
                    }

                    return this.stripe.stripeJs.confirmSepaDebitPayment(clientSecret, confirmParams);
                case STRIPE_METHOD_BOLETO:
                    if (isSetup) {
                        return this.stripe.stripeJs.confirmBoletoSetup(clientSecret, confirmParams);
                    }

                    return this.stripe.stripeJs.confirmBoletoPayment(clientSecret, confirmParams);
                case STRIPE_METHOD_ACSS_DEBIT:
                    if (isSetup) {
                        return this.stripe.stripeJs.confirmAcssDebitSetup(clientSecret, confirmParams);
                    }

                    return this.stripeJs.confirmAcssDebitPayment(clientSecret, confirmParams);
                case STRIPE_METHOD_US_BANK_ACCOUNT:
                    if (isSetup) {
                        return this.stripe.stripeJs.confirmUsBankAccountSetup(clientSecret, confirmParams);
                    }

                    return this.stripeJs.confirmUsBankAccountPayment(clientSecret, confirmParams);
                default:
                    throw new Error(__('This payment method is not supported.'));
                }
            };

            const { error } = await confirmPayment();

            if (error) {
                const { message, code } = error;

                // vvv All minor errors are handled here
                if (code === STRIPE_AUTHORIZATION_ERROR_CODE) {
                    this.setState({ isCurrentlyLoading: false });
                    // vvv Dispatch event to prevent inifite loading in checkout
                    document.dispatchEvent(new Event(STRIPE_CONFIRMATION_FAILED_EVENT));
                    // eslint-disable-next-line no-console
                    console.log(message);
                    return;
                }

                throw new Error(message);
            }
        } catch (e) {
            // vvv Major error, redirect to success page, show error
            this.onFatalError(e);
            return;
        }

        this.setState({ isCurrentlyLoading: false });
        this.onSuccess();
    };

    onSuccess() {
        const { paymentsConfig: { successUrl } } = this.state;
        window.location = successUrl;
    }

    onFatalError(e) {
        const cartRedirectUrl = new URL(window.location.href);
        cartRedirectUrl.pathname = '/checkout/success';
        cartRedirectUrl.searchParams.set('stripeError', e.message);
        window.location = cartRedirectUrl.href;
    }

    __construct(props) {
        super.__construct(props);
        this.getPaymentsConfig();
    }

    getPaymentsConfig = async (isFirstTime = true) => {
        const { showErrorNotification } = this.props;

        // vvv We wait for this, otherwise would need to check in didUpdate and __construct
        await waitForCallback(() => getStore().getState().CartReducer?.cartTotals?.id);

        const { stripePaymentsConfig: paymentsConfig } = await fetchQuery(
            StripePaymentsConfigQuery.getStripePaymentsConfigField()
        );

        const { savedMethods } = paymentsConfig;

        // vvv Allow only one more request to avoid infinite loop
        if (!savedMethods) {
            if (isFirstTime) {
                await this.getPaymentsConfig(false);
                // ^^^ Try requesting config again, for some reason this helps
                //     this is known to happen for guest users only
                return;
            }

            showErrorNotification(__('Sorry, can not initialize Stripe. Reload the page.'));
            return;
        }

        this.setState({
            paymentsConfig,
            currentDropdownValue: savedMethods.length > 0
                ? savedMethods[0].fingerprint
                : STRIPE_NEW_PAYMENT_METHOD
        }, () => {
            // vvv Init payment form, config is avialble now
            if (this.getIsPaymentFormVisible()) {
                this.initPaymentForm();
            }
        });
    };

    setCurrentDropdownValue(currentDropdownValue) {
        this.setState({ currentDropdownValue });
    }

    containerProps() {
        const { currentDropdownValue } = this.state;

        return {
            isLoading: this.getIsLoading(),
            isPaymentFormVisible: this.getIsPaymentFormVisible(),
            isCvcCollectionNeeded: this.getIsCvcCollectionNeeded(),
            currentDropdownValue,
            dropdownOptions: this.getDropdownOptions()
        };
    }

    getIsCvcCollectionNeeded() {
        const {
            currentDropdownValue,
            paymentsConfig: { savedMethods }
        } = this.state;

        return savedMethods.some((savedMethod) => {
            const { fingerprint, type, cvc } = savedMethod;

            if (fingerprint !== currentDropdownValue) {
                // ^^^ This method is not selected
                return false;
            }

            if (type !== 'card') {
                return false;
            }

            // vvv Only return if there is no CVC on card
            return !cvc;
        });
    }

    getIsPaymentFormVisible() {
        const { currentDropdownValue } = this.state;
        return currentDropdownValue === STRIPE_NEW_PAYMENT_METHOD;
    }

    getIsLoading() {
        const {
            isCurrentlyLoading,
            paymentsConfig: { clientSecret }
        } = this.state;

        return isCurrentlyLoading || clientSecret === undefined;
    }

    getDropdownOptions() {
        const { paymentsConfig: { savedMethods } } = this.state;

        return [
            ...savedMethods.map((savedMethod) => {
                const {
                    fingerprint,
                    label,
                    icon,
                    brand
                } = savedMethod;

                return {
                    label,
                    icon,
                    brand,
                    value: fingerprint,
                    id: fingerprint
                };
            }),
            {
                label: __('New payment method'),
                value: STRIPE_NEW_PAYMENT_METHOD,
                id: STRIPE_NEW_PAYMENT_METHOD
            }
        ];
    }

    render() {
        return (
            <StripePayments
              { ...this.containerFunctions }
              { ...this.containerProps() }
            />
        );
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(StripePaymentsContainer);
