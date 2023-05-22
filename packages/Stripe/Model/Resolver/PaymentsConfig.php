<?php

/**
 * Stripe compatibility ScandiPWA
 * @copyright Scandiweb, Inc. All rights reserved.
 */

namespace Scandiweb\Stripe\Model\Resolver;

use Magento\Framework\GraphQl\Config\Element\Field;
use Magento\Framework\GraphQl\Query\ResolverInterface;
use Magento\Framework\GraphQl\Schema\Type\ResolveInfo;
use StripeIntegration\Payments\Api\Service;
use Magento\QuoteGraphQl\Model\Cart\GetCartForUser;
use Magento\Checkout\Model\Session;
use StripeIntegration\Payments\Helper\Generic;
use Zend_Json;

class PaymentsConfig implements ResolverInterface
{
    protected Service $stripeService;
    protected GetCartForUser $getCartForUser;
    protected Session $checkoutSession;
    protected Generic $paymentsHelper;

    public function __construct(
        Service $stripeService,
        GetCartForUser $getCartForUser,
        Session $checkoutSession,
        Generic $paymentsHelper
    ) {
        $this->getCartForUser = $getCartForUser;
        $this->stripeService = $stripeService;
        $this->checkoutSession = $checkoutSession;
        $this->paymentsHelper = $paymentsHelper;
    }

    public function resolve(
        Field $field,
        $context,
        ResolveInfo $info,
        array $value = null,
        array $args = null
    ) {
        $maskedCartId = $args['cartId'];

        $currentUserId = $context->getUserId();
        $storeId = (int) $context->getExtensionAttributes()->getStore()->getId();
        $cart = $this->getCartForUser->execute($maskedCartId, $currentUserId, $storeId);

        // vvv Update checkout session quote ID
        $this->checkoutSession->setQuoteId($cart->getId());
        $rawPaymentsConfig = $this->stripeService->get_client_secret();
        $paymentsConfig = Zend_Json::decode($rawPaymentsConfig);

        $paymentsConfig['successUrl'] = $this->paymentsHelper->getUrl(
            'scandiweb_stripe/payment/index',
            ['_query' => ['cartId' => $cart->getId()]]
        );

        return $paymentsConfig;
    }
}
