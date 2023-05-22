/**
 * Stripe compatibility for ScandiPWA
 * @copyright Scandiweb, Inc. All rights reserved.
 */

import PropTypes from 'prop-types';
import { PureComponent } from 'react';
import { connect } from 'react-redux';

import { showNotification } from 'Store/Notification/Notification.action';
import { fetchMutation, fetchQuery, getErrorMessage } from 'Util/Request';

import StripeDeleteMyPaymentMethodMutation from '../../query/StripeDeleteMyPaymentMethod.mutation';
import StripeMyPaymentMethodsConfigQuery from '../../query/StripeMyPaymentMethodsConfig.query';
import { Payments } from '../../util/compat/payments';
import MyPaymentMethods from './MyPaymentMethods.component';
import { STRIPE_MY_PAYMENTS_ELEMENT_ID } from './MyPaymentMethods.config';

/** @namespace Scandiweb/Stripe/Component/MyPaymentMethods/Container/mapStateToProps */
export const mapStateToProps = () => ({});

/** @namespace Scandiweb/Stripe/Component/MyPaymentMethods/Container/mapDispatchToProps */
export const mapDispatchToProps = (dispatch) => ({
    showErrorNotification: (message) => dispatch(showNotification('error', message))
});

/** @namespace Scandiweb/Stripe/Component/MyPaymentMethods/Container */
export class MyPaymentMethodsContainer extends PureComponent {
    static propTypes = {
        showErrorNotification: PropTypes.func.isRequired
    };

    state = {
        paymentsConfig: { savedMethods: [] },
        isFormComplete: false,
        isCurrentlyLoading: false
    };

    containerFunctions = {
        onSubmit: this.onSubmit.bind(this)
    };

    getIsLoading() {
        const {
            isCurrentlyLoading,
            paymentsConfig: { clientSecret }
        } = this.state;

        return isCurrentlyLoading || clientSecret === undefined;
    }

    containerProps() {
        const {
            paymentsConfig: {
                savedMethods
            },
            isFormComplete
        } = this.state;

        return {
            savedMethods,
            isFormComplete,
            isLoading: this.getIsLoading()
        };
    }

    getPaymentsConfig = async () => {
        const { stripeMyPaymentMethodsConfig } = await fetchQuery(
            StripeMyPaymentMethodsConfigQuery.getStripeMyPaymentMethodsConfigField()
        );

        const { savedMethods } = stripeMyPaymentMethodsConfig;
        const processedMethods = savedMethods.map((method) => ({
            ...method,
            removePayment: () => this.removePaymentMethod(method)
        }));

        this.setState({
            paymentsConfig: {
                ...stripeMyPaymentMethodsConfig,
                savedMethods: processedMethods
            }
        }, () => {
            // vvv Init payment form, config is avialble now
            this.initPaymentForm();
        });
    };

    async removePaymentMethod(method) {
        const { showErrorNotification } = this.props;
        const { paymentsConfig } = this.state;
        const { fingerprint, value } = method;

        this.setState({ isCurrentlyLoading: true });

        try {
            const {
                deleteMyPaymentMethod: newSavedMethods
            } = await fetchMutation(StripeDeleteMyPaymentMethodMutation.getDeleteMyPaymentMethodField({
                fingerprint,
                token: value
            }));

            this.setState({
                paymentsConfig: {
                    ...paymentsConfig,
                    savedMethods: newSavedMethods
                },
                isCurrentlyLoading: false
            });
        } catch (e) {
            showErrorNotification(getErrorMessage(e));
            this.setState({ isCurrentlyLoading: false });
        }
    }

    async initPaymentForm() {
        const { paymentsConfig: { clientSecret } } = this.state;

        if (!clientSecret) {
            // ^^^ Skip this init call
            return;
        }

        this.setState({ isFormComplete: false });
        // ^^^ Reset payment form status on init

        this.stripe = new Payments();
        await this.stripe.init();

        // ^^^ Init elements if not saved
        const { locale } = await this.stripe.getConfig();
        this.elements = this.stripe.stripeJs.elements({
            locale,
            clientSecret
        });

        // vvv Passing no options, original extensions passes some address fields
        const pElement = this.elements.create('payment', {});
        pElement.mount(`#${STRIPE_MY_PAYMENTS_ELEMENT_ID}`);
        pElement.on('change', ({ complete }) => {
            this.setState({ isFormComplete: !!complete });
        });
    }

    async onSubmit() {
        const { showErrorNotification } = this.props;
        const { isFormComplete } = this.state;

        try {
            if (!isFormComplete) {
                throw new Error(__('Please complete your payment details.'));
            }

            this.setState({ isCurrentlyLoading: true });

            if (!this.stripe) {
                // vvv Init stripe if not avilable
                this.stripe = new Payments();
                await this.stripe.init();
            }

            const { error } = await this.stripe.stripeJs.confirmSetup({
                elements: this.elements,
                confirmParams: {
                    // vvv Return to the same page
                    return_url: window.location.href
                }
            });

            if (error) {
                throw new Error(error.message);
            }

            await this.getPaymentsConfig();
        } catch (e) {
            if (e.message) {
                showErrorNotification(e.message);
            }
        }

        this.setState({ isCurrentlyLoading: false });
    }

    __construct(props) {
        super.__construct(props);
        this.getPaymentsConfig();
    }

    render() {
        return (
            <MyPaymentMethods
              { ...this.containerFunctions }
              { ...this.containerProps() }
            />
        );
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(MyPaymentMethodsContainer);
