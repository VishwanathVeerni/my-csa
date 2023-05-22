/**
 * Stripe compatibility for ScandiPWA
 * @copyright Scandiweb, Inc. All rights reserved.
 */

import { UPDATE_CONFIG } from 'SourceStore/Config/Config.action';

import StripeConfigQuery from '../query/StripeConfig.query';

// vvv Importing all styles here
import '../style/stripe';

const addStripeConfigtoRequest = (args, callback) => ([
    ...callback(...args),
    StripeConfigQuery.getStripeConfigField()
]);

const addStripeConfigToState = (args, callback) => ({
    ...callback(...args),
    stripeConfig: {}
});

const getStripeConfigFromAction = (args, callback) => {
    const [, action] = args;
    const { type, config: { stripeConfig } = {} } = action;

    if (type !== UPDATE_CONFIG) {
        return callback(...args);
    }

    return {
        ...callback(...args),
        stripeConfig
    };
};

export default {
    'Store/Config/Dispatcher': {
        'member-function': {
            prepareRequest: addStripeConfigtoRequest
        }
    },
    'Store/Config/Reducer/getInitialState': {
        function: addStripeConfigToState
    },
    'Store/Config/Reducer/ConfigReducer': {
        function: getStripeConfigFromAction
    }
};
