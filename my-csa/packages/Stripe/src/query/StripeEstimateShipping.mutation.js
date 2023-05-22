/**
 * Stripe compatibility for ScandiPWA
 * @copyright Scandiweb, Inc. All rights reserved.
 */

import getStore from 'SourceUtil/Store';
import { Field } from 'Util/Query';

/** @namespace Scandiweb/Stripe/Query/StripeEstimateShipping/Mutation */
export class StripeEstimateShippingMutation {
    getStripeEstimateShippingField({ address }) {
        const cartId = getStore().getState().CartReducer?.cartTotals?.id;

        return new Field('stripeEstimateShipping')
            .addArgument('address', 'StripeAddressInput!', address)
            .addArgument('cartId', 'String!', cartId)
            .addFieldList(this.getStripeEstimateShippingFields());
    }

    getStripeEstimateShippingFields() {
        return [
            'id',
            'label',
            'amount'
        ];
    }
}

export default new StripeEstimateShippingMutation();
