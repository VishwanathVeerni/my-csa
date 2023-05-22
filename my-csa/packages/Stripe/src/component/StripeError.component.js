/**
 * Stripe compatibility for ScandiPWA
 * @copyright Scandiweb, Inc. All rights reserved.
 */

/** @namespace Scandiweb/Stripe/Component/StripeError/Component/StripeError */
export function StripeError() {
    return (
        <div block="CheckoutSuccess">
            <h3>{ __('The order could not be placed') }</h3>
            <p>{ __('Please contact us for assistance') }</p>
        </div>
    );
}
