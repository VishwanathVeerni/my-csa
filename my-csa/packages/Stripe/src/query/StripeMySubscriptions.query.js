/**
 * Stripe compatibility for ScandiPWA
 * @copyright Scandiweb, Inc. All rights reserved.
 */

import { Field } from 'Util/Query';

import stripePaymentsConfigQuery from './StripePaymentsConfig.query';

/** @namespace Scandiweb/Stripe/Query/StripeMySubscriptions/Query */
export class StripeMySubscriptionsQuery {
    getStripeMySubscriptionsField() {
        return new Field('stripeMySubscriptions')
            .addFieldList(this.getStripeMySubscriptionsFields());
    }

    getStripeMySubscriptionsFields() {
        return [
            'id',
            'name',
            'billedAt',
            'orderId',
            this.getPaymentMethodField()
        ];
    }

    getPaymentMethodField() {
        // vvv Reuse other query due to same interface used
        const childFields = stripePaymentsConfigQuery.getSavedMethodsFields();

        return new Field('paymentMethod')
            .addFieldList(childFields);
    }
}

export default new StripeMySubscriptionsQuery();
