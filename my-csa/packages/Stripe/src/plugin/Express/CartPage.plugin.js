/**
 * Stripe compatibility for ScandiPWA
 * @copyright Scandiweb, Inc. All rights reserved.
 */

import { Children, cloneElement } from 'react';

import { ExpressComponent } from '../../component/Express.component';
import { STRIPE_EXPRESS_CART_TYPE } from '../../util/compat/payments-express';

const addExpressPayments = (args, callback, instance) => {
    const { hasOutOfStockProductsInCart } = instance.props;
    const checkoutWrapper = callback(...args);

    if (hasOutOfStockProductsInCart) {
        return checkoutWrapper;
    }

    return cloneElement(
        checkoutWrapper,
        checkoutWrapper.props,
        Children.map(
            checkoutWrapper.props.children,
            (child, i) => {
                const lastIndex = checkoutWrapper.props.children.length
                    ? checkoutWrapper.props.children.length - 1
                    : 0;

                if (i !== lastIndex) {
                    return child;
                }

                return (
                    <>
                        { child }
                        <ExpressComponent type={ STRIPE_EXPRESS_CART_TYPE } />
                    </>
                );
            }
        )
    );
};

export default {
    'Route/CartPage/Component': {
        'member-function': {
            renderSecureCheckoutButton: addExpressPayments
        }
    }
};
