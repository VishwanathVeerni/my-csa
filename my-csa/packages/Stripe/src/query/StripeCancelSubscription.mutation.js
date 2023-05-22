/**
 * Stripe compatibility for ScandiPWA
 * @copyright Scandiweb, Inc. All rights reserved.
 */

import { Field } from 'Util/Query';

import StripeMySubscriptionsQuery from './StripeMySubscriptions.query';

/** @namespace Scandiweb/Stripe/Query/StripeCancelSubscription/Mutation */
export class StripeCancelSubscriptionMutation {
    getCancelSubscriptionField({ subscriptionId }) {
        return new Field('cancelSubscription')
            .addArgument('subscriptionId', 'String!', subscriptionId)
            .addFieldList(this.getCancelSubscriptionFields());
    }

    getCancelSubscriptionFields() {
        // vvv Reuse other query due to same interface used
        return StripeMySubscriptionsQuery.getStripeMySubscriptionsFields();
    }
}

export default new StripeCancelSubscriptionMutation();
