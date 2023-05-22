/**
 * Stripe compatibility for ScandiPWA
 * @copyright Scandiweb, Inc. All rights reserved.
 */

import { cloneElement } from 'react';

import {
    STRIPE_CONFIRMATION_FAILED_EVENT,
    STRIPE_ORDER_PLACED_EVENT
} from '../../component/StripePayments/StripePayments.config';

const preventSubmissionIfOrderPlaced = (args, callback, instance) => {
    const { isConfirmationFailed, orderId } = instance.state;

    if (!isConfirmationFailed) {
        callback(...args);
        return;
    }

    // vvv Re-dispatch event to re-confirm a payment
    document.dispatchEvent(
        new CustomEvent(STRIPE_ORDER_PLACED_EVENT, {
            detail: {
                orderId
            }
        })
    );
};

const handleStripeConfirmationError = (_args, _callback, instance) => {
    const { showErrorNotification } = instance.props;

    showErrorNotification(__('Could not confirm the payment. Please try again.'));

    instance.setState({
        isLoading: false,
        isConfirmationFailed: true
    });
};

const listenForStripeConfirmationError = (args, callback, instance) => {
    callback(...args);

    document.addEventListener(
        STRIPE_CONFIRMATION_FAILED_EVENT,
        instance.handleStripeConfirmationError
    );
};

const unlistenForStripeConfirmationError = (args, callback, instance) => {
    callback(...args);

    document.removeEventListener(
        STRIPE_CONFIRMATION_FAILED_EVENT,
        instance.handleStripeConfirmationError
    );
};

const saveOrderForNextConfirmationAttempt = (args, callback, instance) => {
    const [orderId] = args;
    instance.setState({ orderId });
    callback(...args);
};

const passConfirmationFailedPropToComponent = (args, callback, instance) => {
    const { isConfirmationFailed } = instance.state;

    return {
        ...callback(...args),
        isConfirmationFailed
    };
};

const addStripeConfirmationFailedClass = (args, callback, instance) => {
    const { isConfirmationFailed } = instance.props;
    const component = callback(...args);

    if (!isConfirmationFailed) {
        return component;
    }

    return cloneElement(
        component,
        {
            ...component.props,
            // vvv Added mod for styling
            className: `${ component.props.className } Checkout_isConfirmationFailed`
        },
        component.props.children
    );
};

export default {
    'Route/Checkout/Container': {
        'member-function': {
            handleStripeConfirmationError,
            // ^^^ This functions aknowledges order placement attemt followed by confirmation failure
            componentDidMount: listenForStripeConfirmationError,
            componentWillUnmount: unlistenForStripeConfirmationError,
            // ^^^ Here we wait for stripe error event
            setDetailsStep: saveOrderForNextConfirmationAttempt,
            // ^^^ This functions ensures we have order id to restart confirmation flow
            savePaymentInformation: preventSubmissionIfOrderPlaced,
            // ^^^ Here we prevent future quote modifications (billing address update, order placement),
            //     we also fire order placed event based on saved order id to re-confirm the payment
            containerProps: passConfirmationFailedPropToComponent
        }
    },
    'Route/Checkout/Component': {
        'member-function': {
            render: addStripeConfirmationFailedClass
        }
    }
};
