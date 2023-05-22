/**
 * Stripe compatibility for ScandiPWA
 * @copyright Scandiweb, Inc. All rights reserved.
 */

const addSubscriptionDetails = (args, callback, instance) => {
    const {
        item: {
            product: {
                stripeSubscriptionDetails
            }
        }
    } = instance.props;

    return (
        <>
            { callback(...args) }
            <div
              block="CartItem"
              elem="Options"
            >
                { (stripeSubscriptionDetails || []).map(({ label, value }) => (
                    <div
                      block="CartItem"
                      elem="Option"
                      key={ label }
                    >
                        <strong>{ `${label}: ` }</strong>
                        <span>{ value }</span>
                    </div>
                )) }
            </div>
        </>
    );
};

export default {
    'Component/CartItem/Component': {
        'member-function': {
            renderProductLinks: addSubscriptionDetails
        }
    }
};
