/**
 * Stripe compatibility for ScandiPWA
 * @copyright Scandiweb, Inc. All rights reserved.
 */

import { lazy } from 'react';
import { Route } from 'react-router-dom';

import { ACCOUNT_TAB } from 'SourceComponent/NavigationTabs/NavigationTabs.config';
import { withStoreRegex } from 'SourceComponent/Router/Router.component';
import { SWITCH_ITEMS_TYPE } from 'SourceComponent/Router/Router.config';
import { THIRD_SECTION } from 'Type/Account.type';

import { MY_PAYMENTS_ROUTE, MY_PAYMENTS_TAB } from '../../component/MyPaymentMethods/MyPaymentMethods.config';
import { MY_SUBSCRIPTIONS_ROUTE, MY_SUBSCRIPTIONS_TAB } from '../../component/MySubscriptions/MySubscriptions.config';

const MyAccount = lazy(() => import(/* webpackMode: "lazy", webpackChunkName: "account" */ 'Route/MyAccount'));
const MySubscriptions = lazy(() => import(
    /* webpackMode: "lazy", webpackChunkName: "account-subscriptions" */
    '../../component/MySubscriptions'
));

const MyPaymentMethods = lazy(() => import(
    /* webpackMode: "lazy", webpackChunkName: "account-payments" */
    '../../component/MyPaymentMethods'
));

const addRoutesToNavigationMap = (member) => ({
    ...member,
    [MY_PAYMENTS_ROUTE]: { name: ACCOUNT_TAB },
    [MY_SUBSCRIPTIONS_ROUTE]: { name: ACCOUNT_TAB }
});

// vvv Required to be disabled by design
/* eslint-disable @scandipwa/scandipwa-guidelines/no-jsx-variables, react/jsx-no-bind, @scandipwa/scandipwa-guidelines/jsx-no-props-destruction */
const addRoutesToSwitchItems = (member) => ([
    ...member,
    {
        component: (
            <Route
              path={ withStoreRegex(MY_SUBSCRIPTIONS_ROUTE) }
              render={ (props) => <MyAccount { ...props } selectedTab={ MY_SUBSCRIPTIONS_TAB } /> }
            />
        ),
        position: 77,
        name: MY_SUBSCRIPTIONS_TAB
    },
    {
        component: (
            <Route
              path={ withStoreRegex(MY_PAYMENTS_ROUTE) }
              render={ (props) => <MyAccount { ...props } selectedTab={ MY_PAYMENTS_TAB } /> }
            />
        ),
        position: 78,
        name: MY_PAYMENTS_ROUTE
    }
]);
/* eslint-enable @scandipwa/scandipwa-guidelines/no-jsx-variables, react/jsx-no-bind, @scandipwa/scandipwa-guidelines/jsx-no-props-destruction */

const addTabsToMyAccount = (member) => ({
    ...member,
    [MY_PAYMENTS_TAB]: {
        url: MY_PAYMENTS_ROUTE,
        tabName: __('My Payment methods'),
        section: THIRD_SECTION,
        isFullUrl: true
    },
    [MY_SUBSCRIPTIONS_TAB]: {
        url: MY_SUBSCRIPTIONS_ROUTE,
        tabName: __('My Subscriptions'),
        section: THIRD_SECTION,
        isFullUrl: true
    }
});

const addTabCompoments = (member) => ({
    ...member,
    [MY_PAYMENTS_TAB]: MyPaymentMethods,
    [MY_SUBSCRIPTIONS_TAB]: MySubscriptions
});

export default {
    'Component/NavigationTabs/Container': {
        'member-property': {
            routeMap: addRoutesToNavigationMap
        }
    },
    'Component/Router/Component': {
        'member-property': {
            [SWITCH_ITEMS_TYPE]: addRoutesToSwitchItems
        }
    },
    'Route/MyAccount/Container': {
        'static-member': {
            tabMap: addTabsToMyAccount
        }
    },
    'Route/MyAccount/Component': {
        'member-property': {
            renderMap: addTabCompoments
        }
    }
};
