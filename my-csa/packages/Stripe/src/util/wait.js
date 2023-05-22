/**
 * Stripe compatibility for ScandiPWA
 * @copyright Scandiweb, Inc. All rights reserved.
 */

export const MAX_TRY_COUNT = 10;
export const TRY_INTERVAL_MS = 150;

/** @namespace Scandiweb/Stripe/Util/Wait/waitForCallback */
export const waitForCallback = async (callback, n = 0) => {
    if (n === MAX_TRY_COUNT) {
        return false;
    }

    const val = callback();

    if (val) {
        return true;
    }

    await new Promise((res) => setTimeout(res, TRY_INTERVAL_MS));
    return waitForCallback(callback, n + 1);
};
