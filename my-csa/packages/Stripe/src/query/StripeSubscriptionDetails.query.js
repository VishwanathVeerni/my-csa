/**
 * Stripe compatibility for ScandiPWA
 * @copyright Scandiweb, Inc. All rights reserved.
 */

import { Field } from 'Util/Query';

/** @namespace Scandiweb/Stripe/Query/StripeSubscriptionDetails/Query */
export class StripeSubscriptionDetailsQuery {
    getStripeSubscriptionDetailsField() {
        return new Field('stripeSubscriptionDetails')
            .addFieldList(this.getStripeSubscriptionDetailsFields());
    }

    getStripeSubscriptionDetailsFields() {
        return [
            'label',
            'value'
        ];
    }
}

export default new StripeSubscriptionDetailsQuery();
