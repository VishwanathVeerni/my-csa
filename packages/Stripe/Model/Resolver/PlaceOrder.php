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
use Zend_Json;

class PlaceOrder implements ResolverInterface
{
    protected Service $stripeService;
    protected GetCartForUser $getCartForUser;
    protected Session $checkoutSession;

    public function __construct(
        Service $stripeService,
        GetCartForUser $getCartForUser,
        Session $checkoutSession
    ) {
        $this->getCartForUser = $getCartForUser;
        $this->stripeService = $stripeService;
        $this->checkoutSession = $checkoutSession;
    }

    public function resolve(
        Field $field,
        $context,
        ResolveInfo $info,
        array $value = null,
        array $args = null
    ) {
        $type = $args['type'];
        $rawPaymentDetails = $args['rawPaymentDetails'];
        $maskedCartId = $args['cartId'];

        $currentUserId = $context->getUserId();
        $storeId = (int) $context->getExtensionAttributes()->getStore()->getId();
        $cart = $this->getCartForUser->execute($maskedCartId, $currentUserId, $storeId);

        // vvv Update checkout session quote ID
        $this->checkoutSession->setQuoteId($cart->getId());

        // vvv Ignore original function result (we do not need to redirect)
        $this->stripeService->place_order(
            Zend_Json::decode($rawPaymentDetails),
            $type
        );

        return [
            'orderId' => $cart->getReservedOrderId()
        ];
    }
}
