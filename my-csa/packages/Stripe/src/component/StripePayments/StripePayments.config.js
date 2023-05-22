/**
 * Stripe compatibility for ScandiPWA
 * @copyright Scandiweb, Inc. All rights reserved.
 */

export const STRIPE_NEW_PAYMENT_METHOD = 'new';
export const STRIPE_PAYMENTS_ELEMENT_ID = 'stripe-payment-element';
export const STRIPE_CVC_ELEMENT_ID = 'stripe-card-cvc-element';

export const STRIPE_ORDER_PLACED_EVENT = 'stripe-order-placed';
export const STRIPE_BILLING_SUBMIT_EVENT = 'stripe-billing-submit';
export const STRIPE_CONFIRMATION_FAILED_EVENT = 'stripe-confirmation-failed';

export const STRIPE_AUTHORIZATION_ERROR_CODE = 'payment_intent_authentication_failure';

export const STRIPE_METHOD_CARD = 'card';
export const STRIPE_METHOD_SEPA_DEBIT = 'sepa_debit';
export const STRIPE_METHOD_BOLETO = 'boleto';
export const STRIPE_METHOD_ACSS_DEBIT = 'acss_debit';
export const STRIPE_METHOD_US_BANK_ACCOUNT = 'us_bank_account';
