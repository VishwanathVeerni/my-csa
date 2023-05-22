/**
 * Stripe compatibility for ScandiPWA
 * @copyright Scandiweb, Inc. All rights reserved.
 */

import { Field } from 'Util/Query';

/** @namespace Scandiweb/Stripe/Query/StripeTotals/Query */
export class StripeTotalsQuery {
    getStripeField() {
        return new Field('stripe')
            .addFieldList(this.getStripeFields());
    }

    getStripeFields() {
        return [
            'initialFee',
            this.getTrialSubscriptionsField()
        ];
    }

    getTrialSubscriptionsField() {
        return new Field('trialSubscriptions')
            .addFieldList(this.getTrialSubscriptionsFields());
    }

    getTrialSubscriptionsFields() {
        return [
            'base_discount_total',
            'base_shipping_total',
            'base_subscriptions_total',
            'base_tax_total',
            'discount_total',
            'shipping_total',
            'subscriptions_total',
            'tax_total'
        ];
    }
}

export default new StripeTotalsQuery();
