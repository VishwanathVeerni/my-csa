/**
 * Stripe compatibility for ScandiPWA
 * @copyright Scandiweb, Inc. All rights reserved.
 */

import { cloneElement } from 'react';

import { getInitialFeeFromTotals, getTrialSubscriptionsFromTotals } from '../../util/stripe';

const accountForTrialSubscriptionsInGrandTotals = (args, callback, instance) => {
    const { totals, totals: { grand_total } } = instance.props;
    const trialSubscriptions = getTrialSubscriptionsFromTotals(totals);
    const prevRender = callback(...args);

    if (trialSubscriptions === 0) {
        return prevRender;
    }

    return cloneElement(
        prevRender,
        {
            ...prevRender.props,
            price: grand_total + trialSubscriptions
        },
        prevRender.props.children
    );
};

const addInitalFeePriceLine = (args, callback, instance) => {
    const { totals } = instance.props;
    const initialFee = getInitialFeeFromTotals(totals);

    return (
        <>
            { callback(...args) }
            { instance.renderPriceLine(initialFee, __('Initial Fee')) }
        </>
    );
};

const addTrialSubscriptionsPriceLine = (args, callback, instance) => {
    const { totals } = instance.props;
    const trialSubscriptions = getTrialSubscriptionsFromTotals(totals);

    return (
        <>
            { callback(...args) }
            { instance.renderPriceLine(trialSubscriptions, __('Trial Subscription(s)')) }
        </>
    );
};

export default {
    'Component/CheckoutOrderSummary/Component': {
        'member-function': {
            renderOrderTotal: accountForTrialSubscriptionsInGrandTotals,
            renderSubTotal: addInitalFeePriceLine,
            renderShipping: addTrialSubscriptionsPriceLine
        }
    }
};
