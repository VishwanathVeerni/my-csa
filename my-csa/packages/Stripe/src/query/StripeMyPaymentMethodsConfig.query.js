/**
 * Stripe compatibility for ScandiPWA
 * @copyright Scandiweb, Inc. All rights reserved.
 */

import { Field } from 'Util/Query';

import stripePaymentsConfigQuery from './StripePaymentsConfig.query';

/** @namespace Scandiweb/Stripe/Query/StripeMyPaymentMethodsConfig/Query */
export class StripeMyPaymentMethodsConfigQuery {
    getStripeMyPaymentMethodsConfigField() {
        // vvv Reuse other query due to same interface used
        const childFields = stripePaymentsConfigQuery.getStripePaymentsConfigFields();

        return new Field('stripeMyPaymentMethodsConfig')
            .addFieldList(childFields);
    }
}

export default new StripeMyPaymentMethodsConfigQuery();
