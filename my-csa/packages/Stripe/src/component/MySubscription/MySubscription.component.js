/**
 * Stripe compatibility for ScandiPWA
 * @copyright Scandiweb, Inc. All rights reserved.
 */

import PropTypes from 'prop-types';
import { PureComponent } from 'react';

import Field from 'Component/Field';
import FIELD_TYPE from 'Component/Field/Field.config';
import Link from 'Component/Link';
import Popup from 'Component/Popup';
import { appendWithStoreCode } from 'Util/Url';

import { MethodsType, SubscriptionType } from '../../type/Stripe.type';
import { MY_PAYMENTS_ROUTE } from '../MyPaymentMethods/MyPaymentMethods.config';

import './MySubscription.style';

/** @namespace Scandiweb/Stripe/Component/MySubscription/Component */
export class MySubscriptionComponent extends PureComponent {
    static propTypes = {
        subscription: SubscriptionType.isRequired,
        savedMethods: MethodsType.isRequired,
        openPopup: PropTypes.func.isRequired,
        selectMethod: PropTypes.func.isRequired,
        closePopup: PropTypes.func.isRequired
    };

    renderPaymentMethod() {
        const { subscription: { paymentMethod } } = this.props;
        const { icon, label, id } = paymentMethod || {};

        if (!id) {
            return (
                <span>
                    { __('No payment method.') }
                </span>
            );
        }

        return (
            <>
                <img src={ icon } alt="" />
                <span>{ label }</span>
            </>
        );
    }

    renderPaymentEdit() {
        const { openPopup } = this.props;

        return (
            <button
              block="Button"
              mods={ { likeLink: true } }
              onClick={ openPopup }
            >
                { __('Change') }
            </button>
        );
    }

    renderPaymentMethodOption = (method) => {
        const {
            subscription: {
                paymentMethod
            },
            selectMethod
        } = this.props;

        const { id, icon, label } = method;
        const { id: currentId } = paymentMethod || {};

        return (
            <button
              block="MySubscription"
              elem="Option"
              // eslint-disable-next-line react/jsx-no-bind
              onClick={ () => selectMethod(id) }
            >
                <Field
                  type={ FIELD_TYPE.checkbox }
                  attr={ {
                      id,
                      name: id,
                      checked: id === currentId
                  } }
                />
                <img src={ icon } alt="" />
                <span>{ label }</span>
            </button>
        );
    };

    renderAddNewPaymentMethod() {
        const { closePopup } = this.props;

        return (
            <Link
              to={ MY_PAYMENTS_ROUTE }
              onClick={ closePopup }
              mix={ {
                  block: 'Button',
                  mix: { block: 'MySubscription', elem: 'Button' }
              } }
            >
                { __('Add a new method') }
            </Link>
        );
    }

    renderPaymentMethodPopup() {
        const { savedMethods, subscription: { id } } = this.props;

        return (
            <Popup
              id={ id }
              mix={ { block: 'MySubscription', elem: 'Form' } }
            >
                { savedMethods.map(this.renderPaymentMethodOption) }
                { this.renderAddNewPaymentMethod() }
            </Popup>
        );
    }

    renderPayment() {
        return (
            <div block="MySubscription" elem="Payment">
                { this.renderPaymentMethod() }
                { this.renderPaymentEdit() }
                { this.renderPaymentMethodPopup() }
            </div>
        );
    }

    renderOrderId() {
        const { subscription: { orderId } } = this.props;

        return (
            <td>
                { /* Order links do not work properly (core bug?) :( */ }
                <Link to={ appendWithStoreCode(`/sales/order/view/order_id/${+orderId}`) }>
                    { orderId }
                </Link>
            </td>
        );
    }

    renderName() {
        const { subscription: { name } } = this.props;

        return (
            <div block="MySubscription" elem="Name">
                { name }
            </div>
        );
    }

    renderBilled() {
        const { subscription: { billedAt } } = this.props;

        return (
            <div block="MySubscription" elem="Billed">
                { billedAt }
            </div>
        );
    }

    renderCancel() {
        const { subscription: { cancel } } = this.props;

        return (
            <button
              block="Button"
              onClick={ cancel }
              mods={ { isHollow: true } }
            >
                { __('Cancel') }
            </button>
        );
    }

    render() {
        return (
            <tr>
                { this.renderOrderId() }
                <td>
                    { this.renderName() }
                    { this.renderBilled() }
                    { this.renderPayment() }
                </td>
                <td>
                    { this.renderCancel() }
                </td>
            </tr>
        );
    }
}

export default MySubscriptionComponent;
