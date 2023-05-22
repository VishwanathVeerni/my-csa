<?php

/**
 * Stripe compatibility ScandiPWA
 * @copyright Scandiweb, Inc. All rights reserved.
 */

namespace Scandiweb\Stripe\Model\Resolver;

use Magento\Framework\GraphQl\Config\Element\Field;
use Magento\Framework\GraphQl\Query\ResolverInterface;
use Magento\Framework\GraphQl\Schema\Type\ResolveInfo;
use Magento\Quote\Api\CartRepositoryInterface;
use StripeIntegration\Payments\Helper\InitialFee;
use StripeIntegration\Payments\Helper\Subscriptions;

class Totals implements ResolverInterface
{
    protected Subscriptions $subscriptionsHelper;
    protected CartRepositoryInterface $quoteRepository;
    protected InitialFee $initialFeeHelper;

    public function __construct(
        InitialFee $initialFeeHelper,
        Subscriptions $subscriptionsHelper,
        CartRepositoryInterface $quoteRepository
    ) {
        $this->initialFeeHelper = $initialFeeHelper;
        $this->subscriptionsHelper = $subscriptionsHelper;
        $this->quoteRepository = $quoteRepository;
    }

    public function resolve(
        Field $field,
        $context,
        ResolveInfo $info,
        array $value = null,
        array $args = null
    ) {
        $quoteId = $value['entity_id'];

        if (!$quoteId) {
            return [];
        }

        $quote = $this->quoteRepository->get($quoteId);

        return [
            'trialSubscriptions' => $this->subscriptionsHelper->getTrialingSubscriptionsAmounts($quote),
            'initialFee' => $this->initialFeeHelper->getTotalInitialFeeFor($quote->getAllItems(), $quote, 1)
        ];
    }
}
