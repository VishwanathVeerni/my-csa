/**
 * Stripe compatibility for ScandiPWA
 * @copyright Scandiweb, Inc. All rights reserved.
 */

import PropTypes from 'prop-types';
import { PureComponent } from 'react';
import { connect } from 'react-redux';

import { showNotification } from 'Store/Notification/Notification.action';
import { fetchMutation, fetchQuery, getErrorMessage } from 'Util/Request';

import StripeCancelSubscriptionMutation from '../../query/StripeCancelSubscription.mutation';
import StripeChangePaymentForSubscriptionMutation from '../../query/StripeChangePaymentForSubscription.mutation';
import StripeMyPaymentMethodsConfigQuery from '../../query/StripeMyPaymentMethodsConfig.query';
import StripeMySubscriptionsQuery from '../../query/StripeMySubscriptions.query';
import { Payments } from '../../util/compat/payments';
import MySubscriptions from './MySubscriptions.component';

/** @namespace Scandiweb/Stripe/Component/MySubscriptions/Container/mapStateToProps */
export const mapStateToProps = () => ({});

/** @namespace Scandiweb/Stripe/Component/MySubscriptions/Container/mapDispatchToProps */
export const mapDispatchToProps = (dispatch) => ({
    showErrorNotification: (message) => dispatch(showNotification('error', message)),
    showSuccessNotification: (message) => dispatch(showNotification('success', message))
});

/** @namespace Scandiweb/Stripe/Component/MySubscriptions/Container */
export class MySubscriptionsContainer extends PureComponent {
    static propTypes = {
        showErrorNotification: PropTypes.func.isRequired,
        showSuccessNotification: PropTypes.func.isRequired
    };

    state = {
        isCurrentlyLoading: false,
        subscriptions: null,
        savedMethods: []
    };

    containerFunctions = {
        // getData: this.getData.bind(this)
    };

    containerProps() {
        const { subscriptions, savedMethods } = this.state;

        return {
            savedMethods,
            subscriptions: subscriptions || [],
            isLoading: this.getIsLoading()
        };
    }

    getIsLoading() {
        const {
            isCurrentlyLoading,
            subscriptions
        } = this.state;

        // vvv By default subscriptions are null
        return isCurrentlyLoading || subscriptions === null;
    }

    async getSubscriptions() {
        const { stripeMySubscriptions, stripeMyPaymentMethodsConfig } = await fetchQuery([
            StripeMySubscriptionsQuery.getStripeMySubscriptionsField(),
            StripeMyPaymentMethodsConfigQuery.getStripeMyPaymentMethodsConfigField()
        ]);

        this.stripe = new Payments();
        await this.stripe.init();

        const subscriptions = stripeMySubscriptions.map((subscription) => ({
            ...subscription,
            // vvv Adding actions to avoid creating sub-components (I am lazy, yeah)
            edit: (paymentMethodId) => this.editSubscription({ paymentMethodId, subscription }),
            cancel: () => this.cancelSubscription({ subscription })
        }));

        const { savedMethods } = stripeMyPaymentMethodsConfig;

        this.setState({ subscriptions, savedMethods });
    }

    async cancelSubscription({ subscription }) {
        const { showErrorNotification, showSuccessNotification } = this.props;
        const { id } = subscription;
        this.setState({ isCurrentlyLoading: true });

        try {
            const { cancelSubscription: subscriptions } = await fetchMutation(
                StripeCancelSubscriptionMutation.getCancelSubscriptionField({
                    subscriptionId: id
                })
            );

            showSuccessNotification(__('The Subscription has been canceled successfully!'));

            this.setState({
                subscriptions,
                isCurrentlyLoading: false
            });
        } catch (e) {
            showErrorNotification(getErrorMessage(e));
            this.setState({ isCurrentlyLoading: false });
        }
    }

    async editSubscription({ paymentMethodId, subscription }) {
        const { showErrorNotification, showSuccessNotification } = this.props;
        const { id: subscriptionId } = subscription;
        this.setState({ isCurrentlyLoading: true });

        try {
            const { changePaymentForSubscription: subscriptions } = await fetchMutation(
                StripeChangePaymentForSubscriptionMutation.getChangePaymentForSubscriptionField({
                    subscriptionId,
                    paymentMethodId
                })
            );

            showSuccessNotification(__('The subscription has been updated.'));

            this.setState({
                subscriptions,
                isCurrentlyLoading: false
            });
        } catch (e) {
            showErrorNotification(getErrorMessage(e));
            this.setState({ isCurrentlyLoading: false });
        }
    }

    __construct(props) {
        super.__construct(props);
        this.getSubscriptions();
    }

    render() {
        return (
            <MySubscriptions
              { ...this.containerFunctions }
              { ...this.containerProps() }
            />
        );
    }
}

export default connect(mapStateToProps, mapDispatchToProps)(MySubscriptionsContainer);
