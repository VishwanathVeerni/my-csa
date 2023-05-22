/**
 * Stripe compatibility for ScandiPWA
 * @copyright Scandiweb, Inc. All rights reserved.
 */

import { Field } from 'Util/Query';

import StripeMySubscriptionsQuery from './StripeMySubscriptions.query';

/** @namespace Scandiweb/Stripe/Query/StripeChangePaymentForSubscription/Mutation */
export class StripeChangePaymentForSubscriptionMutation {
    getChangePaymentForSubscriptionField({ subscriptionId, paymentMethodId }) {
        return new Field('changePaymentForSubscription')
            .addArgument('subscriptionId', 'String!', subscriptionId)
            .addArgument('paymentMethodId', 'String!', paymentMethodId)
            .addFieldList(this.getChangePaymentForSubscriptionFields());
    }

    getChangePaymentForSubscriptionFields() {
        // vvv Reuse other query due to same interface used
        return StripeMySubscriptionsQuery.getStripeMySubscriptionsFields();
    }
}

export default new StripeChangePaymentForSubscriptionMutation();
