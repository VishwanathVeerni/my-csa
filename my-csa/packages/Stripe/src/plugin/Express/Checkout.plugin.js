/**
 * Stripe compatibility for ScandiPWA
 * @copyright Scandiweb, Inc. All rights reserved.
 */

import { BILLING_STEP } from 'Route/Checkout/Checkout.config';

import { CheckoutExpress } from '../../component/CheckoutExpress.component';

const addExpressPayments = (args, callback, instance) => {
    const { checkoutStep } = instance.props;

    // vvv Only show express checkout on billing step
    if (checkoutStep !== BILLING_STEP) {
        return callback(...args);
    }

    return (
        <>
            <CheckoutExpress />
            { callback(...args) }
        </>
    );
};

export default {
    'Route/Checkout/Component': {
        'member-function': {
            renderStep: addExpressPayments
        }
    }
};
