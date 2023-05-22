/**
 * Stripe compatibility for ScandiPWA
 * @copyright Scandiweb, Inc. All rights reserved.
 */

import { DETAILS_STEP } from 'Route/Checkout/Checkout.config';

import { StripeError } from '../../component/StripeError.component';

const STRIPE_ERROR_ORDER_ID = 'never';

const showSuccessIfErrorIsPassed = (args, callback, instance) => {
    callback(...args);

    // vvv Check for order ID coming from URL, if present, show success
    const stripeError = new URLSearchParams(window.location.search).get('stripeError');

    if (!stripeError) {
        return;
    }

    // eslint-disable-next-line no-param-reassign
    instance.state = {
        ...instance.state,
        isLoading: true,
        checkoutStep: DETAILS_STEP,
        orderID: STRIPE_ERROR_ORDER_ID,
        stripeError,
        // vvv Hide guest email form
        isGuestEmailSaved: true
    };
};

const resetCartIfErrorIsPassed = (args, callback, instance) => {
    const { stripeError } = instance.state;
    // ^^^ This can only happen if it was originally passed via URL

    if (!stripeError) {
        callback(...args);
        return;
    }

    // vvv Calling this to reset cart, do nothing else
    instance.setDetailsStep(STRIPE_ERROR_ORDER_ID);
};

const showErrorForErrorOrderId = (args, callback, instance) => {
    const { orderID } = instance.props;

    if (orderID !== STRIPE_ERROR_ORDER_ID) {
        return callback(...args);
    }

    return (
        <StripeError />
    );
};

const changeTitleToErrorIfErrorIsPassed = (member) => {
    // vvv Check for order ID coming from URL, if present, show success
    const stripeError = new URLSearchParams(window.location.search).get('stripeError');

    return {
        ...member,
        [DETAILS_STEP]: {
            ...member[DETAILS_STEP],
            title: stripeError
        }
    };
};

export default {
    'Route/Checkout/Container': {
        'member-function': {
            __construct: showSuccessIfErrorIsPassed,
            componentDidMount: resetCartIfErrorIsPassed
        }
    },
    'Route/Checkout/Component': {
        'member-property': {
            stepMap: changeTitleToErrorIfErrorIsPassed
        }
    },
    'Component/CheckoutSuccess/Component': {
        'member-function': {
            render: showErrorForErrorOrderId
        }
    }
};
