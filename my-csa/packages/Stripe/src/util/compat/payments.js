/**
 * Stripe compatibility for ScandiPWA
 * @copyright Scandiweb, Inc. All rights reserved.
 */

import { loadStripe } from '@stripe/stripe-js/pure';

import getStore from 'SourceUtil/Store';
import { showNotification } from 'Store/Notification/Notification.action';

import { waitForCallback } from '../wait';

export const SUCCESS_RESULT_CODE = 'success';
export const PAYMENT_INTENT_ACTION_NEEDED_STATUSES = [
    'requires_action',
    'requires_source_action'
];
export const PAYMENT_INTENT_MANUAL_CONFIRMATION = 'manual';

/**
 * NOTE: This file is intended to stay compatible
 * with view/base/web/js/stripe_payments.js file
 * @namespace Scandiweb/Stripe/Util/Compat/Payments
 */
export class Payments {
    async init() {
        const { apiKey, appInfo } = await this.getConfig();

        try {
            this.stripeJs = await loadStripe(apiKey);
            this.paymentIntentIds = [];
            this.paymentIntentId = null;
        } catch (e) {
            console.log(e);

            if (e.message) {
                getStore().dispatch(showNotification('error', e.message));
            }
        }

        if (!appInfo) {
            return;
        }

        this.stripeJs.registerAppInfo(appInfo);
    }

    async getConfig() {
        await waitForCallback(() => getStore().getState().ConfigReducer?.stripeConfig?.params);
        return getStore().getState().ConfigReducer?.stripeConfig?.params;
    }

    async isAuthenticationRequired(message) {
        this.paymentIntentId = null;

        if (!message) {
            // ^^^ 500 server side errors
            return false;
        }

        if (message.indexOf('Authentication Required: ') >= 0) {
            // ^^^ We are dealing with subscriptions ???
            this.paymentIntentIds = message.substring('Authentication Required: '.length).split(',');
            return true;
        }

        return false;
    }

    async processNextAuthentication() {
        if (this.paymentIntentIds.length <= 0) {
            this.paymentIntentId = null;
            return;
        }

        this.paymentIntentId = this.paymentIntentIds.pop();
        await this.authenticateCustomer();
        await this.processNextAuthentication();
        // ^^^ Loop to next payment intent
    }

    async authenticateCustomer() {
        if (!this.paymentIntentId) {
            // ^^^ We should not be here, throw?
            // eslint-disable-next-line no-debugger
            debugger;
            return;
        }

        const { error, paymentIntent } = await this.stripeJs.retrievePaymentIntent(this.paymentIntentId);

        if (error) {
            throw new Error(error.message);
        }

        const {
            status,
            confirmation_method: confirmationMethod,
            client_secret: clientSecret
        } = paymentIntent;

        if (!PAYMENT_INTENT_ACTION_NEEDED_STATUSES.includes(status)) {
            // ^^^ No action is needed ?
            return;
        }

        if (confirmationMethod === PAYMENT_INTENT_MANUAL_CONFIRMATION) {
            await this.handleCardAction(clientSecret);
        } else {
            await this.handleCardPayment(clientSecret);
        }
    }

    async handleCardPayment(clientSecret) {
        this.closePaysheet(SUCCESS_RESULT_CODE);
        const { error } = await this.stripeJs.handleCardPayment(clientSecret);

        if (error) {
            throw new Error(error.message);
        }
    }

    async handleCardAction(clientSecret) {
        this.closePaysheet(SUCCESS_RESULT_CODE);
        const { error } = await this.stripeJs.handleCardAction(clientSecret);

        if (error) {
            throw new Error(error.message);
        }
    }

    async closePaysheet(resultString) {
        if (this.PRAPIEvent) {
            this.PRAPIEvent.complete(resultString);
        } else if (this.paymentRequest) {
            this.paymentRequest.abort();
        }
    }
}
