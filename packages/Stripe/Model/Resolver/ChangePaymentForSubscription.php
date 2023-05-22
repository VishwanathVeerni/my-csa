<?php

/**
 * Stripe compatibility ScandiPWA
 * @copyright Scandiweb, Inc. All rights reserved.
 */

namespace Scandiweb\Stripe\Model\Resolver;

use Exception;
use Magento\Framework\DataObject;
use Magento\Framework\GraphQl\Config\Element\Field;
use Magento\Framework\GraphQl\Query\ResolverInterface;
use Magento\Framework\GraphQl\Schema\Type\ResolveInfo;
use Stripe\Subscription;
use StripeIntegration\Payments\Helper\Generic;
use StripeIntegration\Payments\Model\StripeCustomer;
use StripeIntegration\Payments\Model\SubscriptionFactory;

class ChangePaymentForSubscription implements ResolverInterface
{
    protected Subscriptions $subscriptions;
    protected Generic $helper;
    protected SubscriptionFactory $subscriptionFactory;

    /**
     * @var DataObject|mixed|StripeCustomer|null
     */
    protected $stripeCustomer;

    public function __construct(
        Subscriptions $subscriptions,
        Generic $helper,
        SubscriptionFactory $subscriptionFactory
    ) {
        $this->subscriptions = $subscriptions;
        $this->helper = $helper;
        $this->subscriptionFactory = $subscriptionFactory;
        $this->stripeCustomer = $helper->getCustomerModel();
    }

    public function resolve(
        Field $field,
              $context,
        ResolveInfo $info,
        array $value = null,
        array $args = null
    ) {
        $subscriptionId = $args['subscriptionId'];
        $cardId = $args['paymentMethodId'];

        if (!$this->stripeCustomer->getStripeId())
            throw new Exception("Could not load customer account for subscription with ID $subscriptionId!");

        Subscription::update($subscriptionId, ['default_payment_method' => $cardId]);

        // vvv Use original subscription resolver to get list
        return $this->subscriptions->resolve(
            $field,
            $context,
            $info,
            $value,
            $args
        );
    }
}
