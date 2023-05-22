/**
 * Stripe compatibility for ScandiPWA
 * @copyright Scandiweb, Inc. All rights reserved.
 */

import getStore from 'SourceUtil/Store';
import { Field } from 'Util/Query';

/** @namespace Scandiweb/Stripe/Query/StripeApplyShipping/Mutation */
export class StripeApplyShippingMutation {
    getStripeApplyShippingField({ address, shippingOptionId }) {
        const cartId = getStore().getState().CartReducer?.cartTotals?.id;

        return new Field('stripeApplyShipping')
            .addArgument('address', 'StripeAddressInput!', address)
            .addArgument('shippingOptionId', 'String!', shippingOptionId)
            .addArgument('cartId', 'String!', cartId)
            .addFieldList(this.getStripeApplyShippingFields());
    }

    getStripeApplyShippingFields() {
        return [
            this.getTotalField(),
            this.getDisplayItemsField()
        ];
    }

    getTotalField() {
        return new Field('total')
            .addFieldList(this.getStripeCartTotalFields());
    }

    getDisplayItemsField() {
        return new Field('displayItems')
            .addFieldList(this.getStripeCartTotalFields());
    }

    getStripeCartTotalFields() {
        return [
            'label',
            'amount',
            'pending'
        ];
    }
}

export default new StripeApplyShippingMutation();
