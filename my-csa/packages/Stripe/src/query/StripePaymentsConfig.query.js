/**
 * Stripe compatibility for ScandiPWA
 * @copyright Scandiweb, Inc. All rights reserved.
 */

import getStore from 'SourceUtil/Store';
import { Field } from 'Util/Query';

/** @namespace Scandiweb/Stripe/Query/StripePaymentsConfig/Query */
export class StripePaymentsConfigQuery {
    getStripePaymentsConfigField() {
        const cartId = getStore().getState().CartReducer?.cartTotals?.id;

        return new Field('stripePaymentsConfig')
            .addArgument('cartId', 'String!', cartId)
            .addFieldList(this.getStripePaymentsConfigFields());
    }

    getStripePaymentsConfigFields() {
        return [
            'clientSecret',
            'successUrl',
            this.getSavedMethodsField()
        ];
    }

    getSavedMethodsField() {
        return new Field('savedMethods')
            .addFieldList(this.getSavedMethodsFields());
    }

    getSavedMethodsFields() {
        return [
            'brand',
            'created',
            'cvc',
            'exp_month',
            'exp_year',
            'fingerprint',
            'icon',
            'id',
            'label',
            'type',
            'value'
        ];
    }
}

export default new StripePaymentsConfigQuery();
