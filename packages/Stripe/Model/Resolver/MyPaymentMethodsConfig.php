<?php

/**
 * Stripe compatibility ScandiPWA
 * @copyright Scandiweb, Inc. All rights reserved.
 */

namespace Scandiweb\Stripe\Model\Resolver;

use Magento\Framework\GraphQl\Config\Element\Field;
use Magento\Framework\GraphQl\Query\ResolverInterface;
use Magento\Framework\GraphQl\Schema\Type\ResolveInfo;
use StripeIntegration\Payments\Block\Customer\PaymentMethods;
use Zend_Json;

class MyPaymentMethodsConfig implements ResolverInterface
{
    protected PaymentMethods $paymentMethods;

    public function __construct(
        PaymentMethods $paymentMethods
    ) {
        $this->paymentMethods = $paymentMethods;
    }

    public function resolve(
        Field $field,
        $context,
        ResolveInfo $info,
        array $value = null,
        array $args = null
    ) {
        $initParams = Zend_Json::decode($this->paymentMethods->getInitParams());

        return [
            'savedMethods' => $this->paymentMethods->getSavedPaymentMethods(),
            'clientSecret' => $initParams['clientSecret'],
            'successUrl' => 'never'
            // ^^^ Use window.location.href on FE, original controller does nothing
        ];
    }
}
