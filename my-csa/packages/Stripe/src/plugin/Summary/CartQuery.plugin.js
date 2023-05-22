/**
 * Stripe compatibility for ScandiPWA
 * @copyright Scandiweb, Inc. All rights reserved.
 */

import StripeSubscriptionDetailsQuery from '../../query/StripeSubscriptionDetails.query';
import StripeTotalsQuery from '../../query/StripeTotals.query';

const addStripeTotalsField = (args, callback) => [
    ...callback(...args),
    StripeTotalsQuery.getStripeField()
];

const addStripeSubscriptionDetailsField = (args, callback) => [
    ...callback(...args),
    StripeSubscriptionDetailsQuery.getStripeSubscriptionDetailsField()
];

export default {
    'Query/Cart/Query': {
        'member-function': {
            _getCartTotalsFields: addStripeTotalsField
        }
    },
    'Query/ProductList/Query': {
        'member-function': {
            _getCartProductInterfaceFields: addStripeSubscriptionDetailsField
        }
    }
};
