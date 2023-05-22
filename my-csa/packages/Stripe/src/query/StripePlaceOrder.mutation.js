/**
 * Stripe compatibility for ScandiPWA
 * @copyright Scandiweb, Inc. All rights reserved.
 */

import getStore from 'SourceUtil/Store';
import { Field } from 'Util/Query';

/** @namespace Scandiweb/Stripe/Query/StripePlaceOrder/Mutation */
export class StripePlaceOrderMutation {
    getPlaceOrderField({ rawPaymentDetails, type }) {
        const cartId = getStore().getState().CartReducer?.cartTotals?.id;

        return new Field('stripePlaceOrder')
            .addArgument('rawPaymentDetails', 'String!', rawPaymentDetails)
            .addArgument('type', 'String!', type)
            .addArgument('cartId', 'String!', cartId)
            .addFieldList(this.getPlaceOrderFields());
    }

    getPlaceOrderFields() {
        return [
            'orderId'
        ];
    }
}

export default new StripePlaceOrderMutation();
