<?php

/**
 * Stripe compatibility ScandiPWA
 * @copyright Scandiweb, Inc. All rights reserved.
 */

namespace Scandiweb\Stripe\Model\Resolver;

use Magento\Framework\GraphQl\Config\Element\Field;
use Magento\Framework\GraphQl\Query\ResolverInterface;
use Magento\Framework\GraphQl\Schema\Type\ResolveInfo;
use Stripe\Subscription;
use StripeIntegration\Payments\Block\Customer\Subscriptions as StripeSubscriptions;

class Subscriptions implements ResolverInterface
{
    protected StripeSubscriptions $subscriptions;

    public function __construct(
        StripeSubscriptions $subscriptions
    ) {
        $this->subscriptions = $subscriptions;
    }

    public function resolve(
        Field $field,
        $context,
        ResolveInfo $info,
        array $value = null,
        array $args = null
    ) {
        /** @var Subscription[] $subscriptions */
        $subscriptions = $this->subscriptions->getSubscriptions();

        $subscriptionsData = [];

        foreach ($subscriptions as $subscription) {
            $subscriptionsData[] = [
                'id' => $subscription->id,
                'name' => implode(", ", $this->subscriptions->getInvoiceItems($subscription)),
                // vvv Strip + decode tags added, as date may return st/nd/th postfix in <sub> element
                'billedAt' => html_entity_decode(
                    strip_tags(implode(" ", [
                        $this->subscriptions->getInvoiceAmount($subscription),
                        $this->subscriptions->formatDelivery($subscription),
                        $this->subscriptions->formatLastBilled($subscription),
                    ]))
                ),
                'orderId' => $subscription->metadata["Order #"],
                'paymentMethod' => $this->subscriptions->getSubscriptionDefaultPaymentMethod($subscription),
            ];
        }

        return $subscriptionsData;
    }
}
