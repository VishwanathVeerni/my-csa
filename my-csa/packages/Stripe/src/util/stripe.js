/**
 * Stripe compatibility for ScandiPWA
 * @copyright Scandiweb, Inc. All rights reserved.
 */

/** @namespace Scandiweb/Stripe/Util/Stripe/getInitialFeeFromTotals */
export const getInitialFeeFromTotals = (totals) => {
    const { stripe } = totals;

    if (!stripe) {
        return 0;
    }

    const { initialFee } = stripe;
    return initialFee;
};

/** @namespace Scandiweb/Stripe/Util/Stripe/getTrialSubscriptionsFromTotals */
export const getTrialSubscriptionsFromTotals = (totals) => {
    const { stripe } = totals;

    if (!stripe) {
        return 0;
    }

    const {
        trialSubscriptions: {
            discount_total,
            shipping_total,
            subscriptions_total,
            tax_total
        }
    } = stripe;

    // from "checkout/trailing_subscriptions.js:getPureValue"
    return parseFloat(discount_total - subscriptions_total - shipping_total - tax_total);
};
