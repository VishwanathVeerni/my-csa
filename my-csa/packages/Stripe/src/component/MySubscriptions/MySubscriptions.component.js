/**
 * Stripe compatibility for ScandiPWA
 * @copyright Scandiweb, Inc. All rights reserved.
 */

import PropTypes from 'prop-types';
import { PureComponent } from 'react';

import Loader from 'Component/Loader';

import { MethodsType, SubscriptionsType } from '../../type/Stripe.type';
import MySubscription from '../MySubscription';

import './MySubscriptions.style';

/** @namespace Scandiweb/Stripe/Component/MySubscriptions/Component */
export class MySubscriptionsComponent extends PureComponent {
    static propTypes = {
        savedMethods: MethodsType.isRequired,
        subscriptions: SubscriptionsType.isRequired,
        isLoading: PropTypes.bool.isRequired
    };

    renderSubscriptionsTitle() {
        return (
            <tr>
                <th>{ __('Order #') }</th>
                <th>{ __('Subscription') }</th>
                <th>{ __('Renewal') }</th>
            </tr>
        );
    }

    renderSubscription = (subscription) => {
        const { savedMethods } = this.props;

        return (
            <MySubscription
              savedMethods={ savedMethods }
              subscription={ subscription }
            />
        );
    };

    renderSubscriptions() {
        const { subscriptions } = this.props;
        return subscriptions.map(this.renderSubscription);
    }

    renderNoSubscriptions() {
        return (
            <p>
                { __('You do not have any subscriptions yet.') }
            </p>
        );
    }

    renderSubscriptionsWrapper() {
        const { subscriptions, isLoading } = this.props;

        if (!subscriptions.length && !isLoading) {
            return this.renderNoSubscriptions();
        }

        return (
            <table block="MySubscriptions" elem="Table">
                <thead>
                    { this.renderSubscriptionsTitle() }
                </thead>
                <tbody>
                    { this.renderSubscriptions() }
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

    render() {
        return (
            <div block="MySubscriptions">
                { this.renderSubscriptionsWrapper() }
                { this.renderLoader() }
            </div>
        );
    }
}

export default MySubscriptionsComponent;
