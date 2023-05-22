/**
 * Stripe compatibility for ScandiPWA
 * @copyright Scandiweb, Inc. All rights reserved.
 */

import PropTypes from 'prop-types';
import { PureComponent } from 'react';

import Field from 'Component/Field';
import FIELD_TYPE from 'Component/Field/Field.config';
import Loader from 'Component/Loader';

import { capitalizeFirstLetter } from '../../util/string';
import { STRIPE_CVC_ELEMENT_ID, STRIPE_PAYMENTS_ELEMENT_ID } from './StripePayments.config';

import './StripePayments.style';

/** @namespace Scandiweb/Stripe/Component/StripePayments/Component */
export class StripePaymentsComponent extends PureComponent {
    static propTypes = {
        isLoading: PropTypes.bool.isRequired,
        isPaymentFormVisible: PropTypes.bool.isRequired,
        isCvcCollectionNeeded: PropTypes.bool.isRequired,
        setCurrentDropdownValue: PropTypes.func.isRequired,
        currentDropdownValue: PropTypes.string.isRequired,
        dropdownOptions: PropTypes.arrayOf(PropTypes.shape({
            label: PropTypes.string,
            id: PropTypes.string,
            value: PropTypes.string
        })).isRequired
    };

    renderLoader() {
        const { isLoading } = this.props;

        return (
            <Loader isLoading={ isLoading } />
        );
    }

    renderDropdown() {
        const {
            setCurrentDropdownValue,
            currentDropdownValue,
            dropdownOptions
        } = this.props;

        if (dropdownOptions.length <= 1) {
            // ^^^ hide dropdown if only one option is available
            return null;
        }

        return (
            <Field
              type={ FIELD_TYPE.select }
              attr={ {
                  id: 'stripe-dropdown',
                  name: 'stripe-dropdown',
                  value: currentDropdownValue,
                  noPlaceholder: true
              } }
              options={ dropdownOptions.map(({ label, brand, ...rest }) => ({
                  ...rest,
                  label: brand ? `(${capitalizeFirstLetter(brand)}) ${label}` : label
                  // ^^^ TODO: render using icon (FieldSelect diplays [Object Object])
              })) }
              mix={ { block: 'StripePayments', elem: 'Select' } }
              events={ {
                  onChange: setCurrentDropdownValue
              } }
            />
        );
    }

    renderPaymentForm() {
        const { isPaymentFormVisible } = this.props;

        if (!isPaymentFormVisible) {
            return null;
        }

        return (
            <div
              block="StripePayments"
              elem="CardElement"
              id={ STRIPE_PAYMENTS_ELEMENT_ID }
            />
        );
    }

    renderCvcForm() {
        const { isCvcCollectionNeeded } = this.props;

        if (!isCvcCollectionNeeded) {
            return null;
        }

        return (
            <div
              block="StripePayments"
              elem="CvcElement"
              id={ STRIPE_CVC_ELEMENT_ID }
            />
        );
    }

    renderContent() {
        return (
            <>
                { this.renderLoader() }
                { this.renderDropdown() }
                { this.renderPaymentForm() }
                { this.renderCvcForm() }
            </>
        );
    }

    render() {
        return (
            <div block="StripePayments">
                { this.renderContent() }
            </div>
        );
    }
}

export default StripePaymentsComponent;
