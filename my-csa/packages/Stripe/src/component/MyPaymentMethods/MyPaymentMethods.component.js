/**
 * Stripe compatibility for ScandiPWA
 * @copyright Scandiweb, Inc. All rights reserved.
 */

import Loader from '@scandipwa/scandipwa/src/component/Loader';
import PropTypes from 'prop-types';
import { PureComponent } from 'react';

import { STRIPE_MY_PAYMENTS_ELEMENT_ID } from './MyPaymentMethods.config';

import './MyPaymentMethods.style';

/** @namespace Scandiweb/Stripe/Component/MyPaymentMethods/Component */
export class MyPaymentMethodsComponent extends PureComponent {
    static propTypes = {
        savedMethods: PropTypes.arrayOf(PropTypes.shape({})).isRequired,
        isLoading: PropTypes.bool.isRequired,
        isFormComplete: PropTypes.bool.isRequired,
        onSubmit: PropTypes.func.isRequired
    };

    renderPaymentMethodsTitle() {
        return (
            <tr>
                <th>{ __('Payment Method') }</th>
                <th>{ __('Actions') }</th>
            </tr>
        );
    }

    renderPaymentMethod = (method) => {
        const {
            removePayment,
            icon,
            label,
            fingerprint
        } = method;

        return (
            <tr key={ fingerprint }>
                <td block="MyPaymentMethods" elem="MethodLabel">
                    <img src={ icon } alt="" />
                    <span>{ label }</span>
                </td>
                <td>
                    <button
                      block="Button"
                      mods={ { likeLink: true } }
                      onClick={ removePayment }
                    >
                        { __('Delete') }
                    </button>
                </td>
            </tr>
        );
    };

    renderPaymentMethods() {
        const { savedMethods } = this.props;
        return savedMethods.map(this.renderPaymentMethod);
    }

    renderNoPaymentMethods() {
        return (
            <p>{ __('No saved payment methods.') }</p>
        );
    }

    renderPaymentMethodWrapper() {
        const { savedMethods } = this.props;

        if (!savedMethods.length) {
            return this.renderNoPaymentMethods();
        }

        return (
            <table block="MyPaymentMethods" elem="Table">
                <thead>
                    { this.renderPaymentMethodsTitle() }
                </thead>
                <tbody>
                    { this.renderPaymentMethods() }
                </tbody>
            </table>
        );
    }

    renderLoader() {
        const { isLoading } = this.props;

        return (
            <Loader isLoading={ isLoading } />
        );
    }

    renderPaymentForm() {
        const { onSubmit, isFormComplete } = this.props;

        return (
            <div block="MyPaymentMethods" elem="Form">
                <div
                  block="MyPaymentMethods"
                  elem="Element"
                  id={ STRIPE_MY_PAYMENTS_ELEMENT_ID }
                />
                <button
                  onClick={ onSubmit }
                  disabled={ !isFormComplete }
                  block="Button"
                >
                    { __('Add') }
                </button>
            </div>
        );
    }

    renderNewPaymentWrapper() {
        return (
            <div block="MyPaymentMethods" elem="NewPayment">
                <h2 block="MyPaymentMethods" elem="Title">
                    { __('Add a new payment method') }
                </h2>
                { this.renderPaymentForm() }
            </div>
        );
    }

    render() {
        return (
            <div block="MyPaymentMethods">
                { this.renderPaymentMethodWrapper() }
                { this.renderNewPaymentWrapper() }
                { this.renderLoader() }
            </div>
        );
    }
}

export default MyPaymentMethodsComponent;
