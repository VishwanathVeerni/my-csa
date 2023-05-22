/**
 * Stripe compatibility for ScandiPWA
 * @copyright Scandiweb, Inc. All rights reserved.
 */

import StripePayments from '../../component/StripePayments';
import {
    STRIPE_BILLING_SUBMIT_EVENT,
    STRIPE_ORDER_PLACED_EVENT
} from '../../component/StripePayments/StripePayments.config';
import { waitForCallback } from '../../util/wait';

const STRIPE_PAYMENT_METHOD_CODE = 'stripe_payments';

const addStripePayments = (member) => ({
    ...member,
    [STRIPE_PAYMENT_METHOD_CODE]: () => (
        <StripePayments />
    )
});

const addStripeDataToPayment = (args, callback, instance) => {
    const { paymentMethod: code } = instance.state;

    if (code !== STRIPE_PAYMENT_METHOD_CODE) {
        return callback(...args);
    }

    // vvv tried to use async data but it is no longer supported

    return {
        code,
        additional_data: window.stripeData
    };
};

const waitForStripeData = (args, callback, instance) => {
    const { paymentMethod: code } = instance.state;

    if (code !== STRIPE_PAYMENT_METHOD_CODE) {
        callback(...args);
        return;
    }

    // vvv Unset stripe data
    window.stripeData = undefined;

    document.dispatchEvent(new CustomEvent(STRIPE_BILLING_SUBMIT_EVENT));

    waitForCallback(
        () => !!window.stripeData
    ).then(
        () => callback(...args)
    );
};

const delaySuccessToConfirmStripe = (args, callback) => {
    if (!window.stripeData) {
        callback(...args);
        return;
    }

    const [orderId] = args;

    document.dispatchEvent(
        new CustomEvent(STRIPE_ORDER_PLACED_EVENT, {
            detail: {
                orderId
            }
        })
    );

    // ^^^ Confirmation error handlign is doen in Reconfirm.plugin.js
};

const cacheBillingDataForConfirmation = (args, callback, instance) => {
    const [{ billing_address }] = args;
    const address = instance.trimAddressMagentoStyle(billing_address);
    window.stripeBillingAddress = address;
    // ^^^ Needed to pass as "payment_method_data" for confirmation
    return callback(...args);
};

export default {
    'Component/CheckoutPayments/Component': {
        'member-property': {
            paymentRenderMap: addStripePayments
        }
    },
    'Component/CheckoutBilling/Container': {
        'member-function': {
            onBillingSuccess: waitForStripeData,
            _getPaymentData: addStripeDataToPayment
        }
    },
    'Route/Checkout/Container': {
        'member-function': {
            setDetailsStep: delaySuccessToConfirmStripe,
            savePaymentInformation: cacheBillingDataForConfirmation
        }
    }
};
