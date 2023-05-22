/**
 * Stripe compatibility for ScandiPWA
 * @copyright Scandiweb, Inc. All rights reserved.
 */

import PropTypes from 'prop-types';
import { useEffect } from 'react';
import { useSelector } from 'react-redux';

import Loader from 'Component/Loader';

import { initStripeExpress } from '../util/compat/payments-express';

/** @namespace Scandiweb/Stripe/Component/Express/Component/ExpressComponent */
export function ExpressComponent(props) {
    const {
        wrapperId,
        type,
        addToCart = () => {},
        productId
    } = props;
    // ^^^ The "addToCart" is only used for products
    // ^^^ The "productId" is only used for products
    // (we can not use one from Redux, may come from state)
    /* eslint-enable react/prop-types */

    const { [type]: isEnabled } = useSelector((state) => state?.ConfigReducer?.stripeConfig?.expressDisplay) || {};
    const elementId = `payment-request-button-${type}`;

    const init = () => {
        if (!isEnabled) {
            return;
        }

        initStripeExpress({
            elementId,
            type,
            wrapperId,
            addToCart,
            productId
        });
    };

    useEffect(init, [isEnabled]);
    useEffect(init, []);

    if (!isEnabled) {
        return null;
    }

    return (
        <div
          className={ `payment-request-button ${type}` }
          id={ elementId }
        >
            <Loader />
        </div>
    );
}

ExpressComponent.propTypes = {
    wrapperId: PropTypes.string.isRequired,
    type: PropTypes.string.isRequired,
    addToCart: PropTypes.func.isRequired,
    productId: PropTypes.string.isRequired
};
