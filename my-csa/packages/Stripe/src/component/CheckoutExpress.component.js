/**
 * Stripe compatibility for ScandiPWA
 * @copyright Scandiweb, Inc. All rights reserved.
 */

import { useSelector } from 'react-redux';

import { STRIPE_EXPRESS_CHECKOUT_TYPE } from '../util/compat/payments-express';
import { ExpressComponent } from './Express.component';

/** @namespace Scandiweb/Stripe/Component/CheckoutExpress/Component/CheckoutExpress */
export function CheckoutExpress() {
    const {
        expressTitle
    } = useSelector((state) => state?.ConfigReducer?.stripeConfig);

    const {
        [STRIPE_EXPRESS_CHECKOUT_TYPE]: isEnabled
    } = useSelector((state) => state?.ConfigReducer?.stripeConfig?.expressDisplay) || {};

    const wrapperId = 'stripe-express-wrapper';

    if (!expressTitle || !isEnabled) {
        return null;
    }

    return (
        <div block="StripeCheckoutExpress" id={ wrapperId }>
            <h2
              block="StripeCheckoutExpress"
              elem="Title"
              mix={ { block: 'Checkout', elem: 'Heading' } }
            >
                { __('Checkout with %s', expressTitle) }
            </h2>
            <ExpressComponent
              type={ STRIPE_EXPRESS_CHECKOUT_TYPE }
              wrapperId={ wrapperId }
            />
        </div>
    );
}
