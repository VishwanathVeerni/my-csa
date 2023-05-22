/**
 * Stripe compatibility for ScandiPWA
 * @copyright Scandiweb, Inc. All rights reserved.
 */

import { Field } from 'Util/Query';

import stripePaymentsConfigQuery from './StripePaymentsConfig.query';

/** @namespace Scandiweb/Stripe/Query/StripeDeleteMyPaymentMethod/Mutation */
export class StripeDeleteMyPaymentMethodMutation {
    getDeleteMyPaymentMethodField({ token, fingerprint }) {
        // vvv Reuse other query due to same interface used
        const childFields = stripePaymentsConfigQuery.getSavedMethodsFields();

        return new Field('deleteMyPaymentMethod')
            .addArgument('token', 'String!', token)
            .addArgument('fingerprint', 'String', fingerprint)
            .addFieldList(childFields);
    }
}

export default new StripeDeleteMyPaymentMethodMutation();
