/**
 * Stripe compatibility for ScandiPWA
 * @copyright Scandiweb, Inc. All rights reserved.
 */

import { DETAILS_STEP } from 'Route/Checkout/Checkout.config';

const showSuccessIfOrderIsPassed = (args, callback, instance) => {
    callback(...args);

    // vvv Check for order ID coming from URL, if present, show success
    const orderId = new URLSearchParams(window.location.search).get('orderId');

    if (!orderId) {
        return;
    }

    // eslint-disable-next-line no-param-reassign
    instance.state = {
        ...instance.state,
        isLoading: true,
        checkoutStep: DETAILS_STEP,
        orderID: orderId,
        // vvv Hide guest email form
        isGuestEmailSaved: true
    };
};

const resetCartIfOrderIsPassed = (args, callback, instance) => {
    const { orderID } = instance.state;
    // ^^^ This can only happen if it was originally passed via URL

    if (!orderID) {
        callback(...args);
        return;
    }

    // vvv Calling this to reset cart, do nothing else
    instance.setDetailsStep(orderID);
};

const hideIfNoEmail = (args, callback, instance) => {
    const { email } = instance.props;

    if (!email) {
        return null;
    }

    return callback(...args);
};

export default {
    'Route/Checkout/Container': {
        'member-function': {
            __construct: showSuccessIfOrderIsPassed,
            componentDidMount: resetCartIfOrderIsPassed
        }
    },
    'Component/CheckoutSuccess/Component': {
        'member-function': {
            renderCreateAccountButton: hideIfNoEmail
        }
    }
};
