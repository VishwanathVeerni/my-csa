<?php

namespace Scandiweb\Stripe\Model\Resolver;

use Magento\Framework\GraphQl\Config\Element\Field;
use Magento\Framework\GraphQl\Query\ResolverInterface;
use Magento\Framework\GraphQl\Schema\Type\ResolveInfo;
use StripeIntegration\Payments\Model\Config as StripeConfig;
use StripeIntegration\Payments\Helper\ExpressHelper;
use StripeIntegration\Payments\Helper\Generic as StripeHelper;
use Zend_Json;

class Config implements ResolverInterface
{
    protected StripeConfig $stripeConfig;
    protected ExpressHelper $expressHelper;
    protected StripeHelper $stripeHelper;

    public function __construct(
        StripeConfig $stripeConfig,
        ExpressHelper $expressHelper,
        StripeHelper $stripeHelper
    ) {
        $this->expressHelper = $expressHelper;
        $this->stripeConfig = $stripeConfig;
        $this->stripeHelper = $stripeHelper;
    }

    public function resolve(
        Field $field,
        $context,
        ResolveInfo $info,
        array $value = null,
        array $args = null
    ) {
        // vvv Use decode, as config auto-encodes this
        $buttonConfig = Zend_Json::decode($this->stripeConfig->getPRAPIButtonSettings());

        // vvv Use decode, as config auto-encodes this
        $params = Zend_Json::decode($this->stripeConfig->getStripeParams());
        $params['appInfo'] = $this->stripeConfig->getAppInfo(true);
        // ^^^ This field is missing in model, but FE uses it

        return [
            'expressTitle' => $this->stripeHelper->getPRAPIMethodType(),
            'buttonConfig' => $buttonConfig,
            'params' => $params,
            'expressDisplay' => [
                'cart' => $this->expressHelper->isEnabled('shopping_cart_page'),
                'minicart' => $this->expressHelper->isEnabled('minicart'),
                'product' => $this->expressHelper->isEnabled('product_page'),
                'checkout' => $this->expressHelper->isEnabled('checkout_page'),
            ]
        ];
    }
}
