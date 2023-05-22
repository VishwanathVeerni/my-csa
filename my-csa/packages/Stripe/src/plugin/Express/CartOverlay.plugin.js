/**
 * Stripe compatibility for ScandiPWA
 * @copyright Scandiweb, Inc. All rights reserved.
 */

import { ExpressComponent } from '../../component/Express.component';
import { STRIPE_EXPRESS_MINICART_TYPE } from '../../util/compat/payments-express';

const addExpressPayments = (args, callback) => (
    <>
        { callback(...args) }
        <ExpressComponent type={ STRIPE_EXPRESS_MINICART_TYPE } />
    </>
);

export default {
    'Component/CartOverlay/Component': {
        'member-function': {
            renderSecureCheckoutButton: addExpressPayments
        }
    }
};
