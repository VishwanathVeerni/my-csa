/**
 * Stripe compatibility for ScandiPWA
 * @copyright Scandiweb, Inc. All rights reserved.
 */

import getStore from 'SourceUtil/Store';
import { Field } from 'Util/Query';

/** @namespace Scandiweb/Stripe/Query/StripeApplePayConfig/Query */
export class StripeApplePayConfigQuery {
    getStripeApplePayConfigField({ type }) {
        const cartId = getStore().getState().CartReducer?.cartTotals?.id;

        return new Field('stripeApplePayConfig')
            .addArgument('type', 'String!', type)
            .addArgument('cartId', 'String!', cartId)
            .addFieldList(this.getStripeApplePayConfigFields());
    }

    getStripeApplePayConfigFields() {
        return [
            'country',
            'requestPayerName',
            'requestPayerEmail',
            'requestPayerPhone',
            'requestShipping',
            'currency',
            this.getTotalField(),
            this.getDisplayItemsField()
        ];
    }

    getTotalField() {
        return new Field('total')
            .addFieldList(this.getStripeApplePayConfigTotalFields());
    }

    getDisplayItemsField() {
        return new Field('displayItems')
            .addFieldList(this.getStripeApplePayConfigTotalFields());
    }

    getStripeApplePayConfigTotalFields() {
        return [
            'label',
            'amount',
            'pending'
        ];
    }
}

export default new StripeApplePayConfigQuery();
