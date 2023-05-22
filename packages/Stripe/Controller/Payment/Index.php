<?php

/**
 * Stripe compatibility ScandiPWA
 * @copyright Scandiweb, Inc. All rights reserved.
 */

namespace Scandiweb\Stripe\Controller\Payment;

use StripeIntegration\Payments\Controller\Payment\Index as StripeIndex;

// vvv This class replaces original controller to fix redirects and provide checkout context
class Index extends StripeIndex
{
    public function execute()
    {
        $quoteId = $this->_request->getParam('cartId');
        // ^^^ attempt to read quote id from passed params

        if ($quoteId) {
            $checkoutSession = $this->checkoutHelper->getCheckout();
            $checkoutSession->setQuoteId($quoteId);
            // ^^^ save it to session, so later it can be read by others
        }

        return parent::execute();
    }

    protected function _redirect($path, $arguments = [])
    {
        if ($path === 'checkout/cart') {
            // vvv This redirects to ScandiPWA cart
            $this->_redirect->redirect($this->getResponse(), 'cart');
        } elseif ($path === 'checkout/onepage/success') {
            // vvv This redirects to ScandiPWA success page with order id handled by Stripe
            $this->_redirect->redirect(
                $this->getResponse(),
                'checkout/success',
                [
                    '_query' => [
                        'orderId' => $this->session->getLastRealOrderId()
                    ]
                ]
            );
        } else {
            $this->_redirect->redirect($this->getResponse(), $path, $arguments);
        }

        return $this->getResponse();
    }
}
