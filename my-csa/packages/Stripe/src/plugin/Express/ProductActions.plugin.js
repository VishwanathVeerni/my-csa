/**
 * Stripe compatibility for ScandiPWA
 * @copyright Scandiweb, Inc. All rights reserved.
 */

import { ExpressComponent } from '../../component/Express.component';
import { STRIPE_EXPRESS_PRODUCT_TYPE } from '../../util/compat/payments-express';

const renderExpressPaymentsOnDesktop = (args, callback, instance) => {
    const { addToCart, product: { id } } = instance.props;
    // ^^^ We need to re-use the add to cart (with validation)

    if (!id) {
        return null;
    }

    return (
        <>
            { callback(...args) }
            <ExpressComponent
              type={ STRIPE_EXPRESS_PRODUCT_TYPE }
              addToCart={ addToCart }
              productId={ id }
            />
        </>
    );
};

export default {
    'Component/ProductActions/Component': {
        'member-function': {
            renderAddToCartActionBlock: renderExpressPaymentsOnDesktop
        }
    }
};
