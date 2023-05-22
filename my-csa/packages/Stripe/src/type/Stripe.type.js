/**
 * Stripe compatibility for ScandiPWA
 * @copyright Scandiweb, Inc. All rights reserved.
 */

import PropTypes from 'prop-types';

export const SubscriptionType = PropTypes.shape({
    paymentMethod: PropTypes.shape({}),
    id: PropTypes.string,
    orderId: PropTypes.string,
    name: PropTypes.string,
    billedAt: PropTypes.string,
    cancel: PropTypes.func
});

export const SubscriptionsType = PropTypes.arrayOf(SubscriptionType);

export const MethodType = PropTypes.shape({
    brand: PropTypes.string,
    created: PropTypes.string,
    cvc: PropTypes.string,
    exp_month: PropTypes.string,
    exp_year: PropTypes.string,
    fingerprint: PropTypes.string,
    icon: PropTypes.string,
    id: PropTypes.string,
    label: PropTypes.string,
    type: PropTypes.string,
    value: PropTypes.string
});

export const MethodsType = PropTypes.arrayOf(MethodType);
