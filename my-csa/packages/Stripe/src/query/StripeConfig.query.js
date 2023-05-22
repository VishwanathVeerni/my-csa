/**
 * Stripe compatibility for ScandiPWA
 * @copyright Scandiweb, Inc. All rights reserved.
 */

import { Field } from 'Util/Query';

/** @namespace Scandiweb/Stripe/Query/StripeConfig/Query */
export class StripeConfigQuery {
    getStripeConfigField() {
        return new Field('stripeConfig')
            .addFieldList(this.getStripeConfigFields());
    }

    getStripeConfigFields() {
        return [
            this.getExpressDisplayField(),
            this.getButtonConfigField(),
            this.getParamsField(),
            'expressTitle'
        ];
    }

    getExpressDisplayField() {
        return new Field('expressDisplay')
            .addFieldList(this.getExpressDisplayFields());
    }

    getExpressDisplayFields() {
        return [
            'cart',
            'minicart',
            'product',
            'checkout'
        ];
    }

    getButtonConfigField() {
        return new Field('buttonConfig')
            .addFieldList(this.getButtonConfigFields());
    }

    getButtonConfigFields() {
        return [
            'type',
            'theme',
            'height'
        ];
    }

    getParamsField() {
        return new Field('params')
            .addFieldList(this.getParamsFields());
    }

    getParamsFields() {
        return [
            this.getStripeAppInfoField(),
            'apiKey',
            'locale'
        ];
    }

    getStripeAppInfoField() {
        return new Field('appInfo')
            .addFieldList(this.getStripeAppInfoFields());
    }

    getStripeAppInfoFields() {
        return [
            'name',
            'version',
            'url',
            'partner_id'
        ];
    }
}

export default new StripeConfigQuery();
