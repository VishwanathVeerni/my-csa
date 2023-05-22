<?php

namespace Scandiweb\Stripe\Model\Resolver;

use Magento\Framework\GraphQl\Config\Element\Field;
use Magento\Framework\GraphQl\Query\ResolverInterface;
use Magento\Framework\GraphQl\Schema\Type\ResolveInfo;
use StripeIntegration\Payments\Helper\InitialFee;

class SubscriptionDetails implements ResolverInterface
{
    protected InitialFee $initialFeeHelper;

    public function __construct(
        InitialFee $initialFeeHelper
    ) {
        $this->initialFeeHelper = $initialFeeHelper;
    }

    public function resolve(
        Field $field,
        $context,
        ResolveInfo $info,
        array $value = null,
        array $args = null
    ) {
        $product = $value['model'];

        if (!$product || !$product->getId()) {
            return [];
        }

        // TODO: get QTY somewhere ? Maybe from context ?
        return $this->initialFeeHelper->getAdditionalOptionsForProductId($product->getId(), 1);
    }
}
