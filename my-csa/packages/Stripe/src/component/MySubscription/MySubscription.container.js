/**
 * Stripe compatibility for ScandiPWA
 * @copyright Scandiweb, Inc. All rights reserved.
 */

import PropTypes from 'prop-types';
import { PureComponent } from 'react';
import { connect } from 'react-redux';

import { hideActiveOverlay } from 'Store/Overlay/Overlay.action';
import { showPopup } from 'Store/Popup/Popup.action';

import { MethodsType, SubscriptionType } from '../../type/Stripe.type';
import MySubscription from './MySubscription.component';

/** @namespace Scandiweb/Stripe/Component/MySubscription/Container/mapStateToProps */
export const mapStateToProps = () => ({});

/** @namespace Scandiweb/Stripe/Component/MySubscription/Container/mapDispatchToProps */
export const mapDispatchToProps = (dispatch) => ({
    showPopup: (id, payload) => dispatch(showPopup(id, payload)),
    hidePopup: () => dispatch(hideActiveOverlay())
});

/** @namespace Scandiweb/Stripe/Component/MySubscription/Container */
export class MySubscriptionContainer extends PureComponent {
    static propTypes = {
        subscription: SubscriptionType.isRequired,
        savedMethods: MethodsType.isRequired,
        showPopup: PropTypes.func.isRequired,
        hidePopup: PropTypes.func.isRequired
    };

    containerFunctions = {
        openPopup: this.openPopup.bind(this),
        closePopup: this.closePopup.bind(this),
        selectMethod: this.selectMethod.bind(this)
    };

    async selectMethod(paymentMethodId) {
        const {
            subscription: {
                id,
                edit,
                paymentMethod
            }
        } = this.props;

        const { id: currentId } = paymentMethod || {};

        if (currentId !== id) {
            // vvv Only cahnge method, if it is updated
            await edit(paymentMethodId);
        }

        this.closePopup();
    }

    openPopup() {
        const { showPopup, subscription: { id, name } } = this.props;
        showPopup(id, { title: __('Edit %s payment method', name) });
    }

    closePopup() {
        const { hidePopup } = this.props;
        hidePopup();
    }

    containerProps() {
        const { subscription, savedMethods } = this.props;

        return {
            subscription,
            savedMethods
        };
    }

    render() {
        return (
            <MySubscription
              { ...this.containerFunctions }
              { ...this.containerProps() }
            />
        );
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(MySubscriptionContainer);
