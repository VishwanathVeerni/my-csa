<?php

/**
 * Stripe compatibility ScandiPWA
 * @copyright Scandiweb, Inc. All rights reserved.
 */

namespace Scandiweb\Stripe\Model\Resolver;

use Magento\Framework\DataObject;
use Magento\Framework\Exception\LocalizedException;
use Magento\Framework\GraphQl\Config\Element\Field;
use Magento\Framework\GraphQl\Query\ResolverInterface;
use Magento\Framework\GraphQl\Schema\Type\ResolveInfo;
use StripeIntegration\Payments\Block\Customer\PaymentMethods;
use StripeIntegration\Payments\Helper\Generic;
use StripeIntegration\Payments\Model\StripeCustomer;

class DeleteMyPaymentMethod implements ResolverInterface
{
    protected PaymentMethods $paymentMethods;
    protected Generic $helper;

    /**
     * @var DataObject|mixed|StripeCustomer|null
     */
    protected $stripeCustomer;

    public function __construct(
        PaymentMethods $paymentMethods,
        Generic $helper
    ) {
        $this->paymentMethods = $paymentMethods;
        $this->helper = $helper;
        $this->stripeCustomer = $helper->getCustomerModel();
    }

    protected function delete(
        $token,
        $fingerprint,
        $customerId
    ) {
        // vvv This code is coming from \StripeIntegration\Payments\Controller\Customer\PaymentMethods
        $statuses = ['processing', 'fraud', 'pending_payment', 'payment_review', 'pending', 'holded'];
        $orders = $this->helper->getCustomerOrders($customerId, $statuses, $token);
        foreach ($orders as $order) {
            throw new LocalizedException(__(
                "Sorry, it is not possible to delete this payment method because order"
                . " #%1 which was placed using it is still being processed.",
                $order->getIncrementId()
            ));
        }

        $this->stripeCustomer->deletePaymentMethod($token, $fingerprint);
        // ^^^ Original method handled success messages here, we will do it on FE
    }

    public function resolve(
        Field $field,
        $context,
        ResolveInfo $info,
        array $value = null,
        array $args = null
    ) {
        $this->delete(
            $args['token'],
            $args['fingerprint'] ?? null,
            $context->getUserId()
        );

        return $this->paymentMethods->getSavedPaymentMethods();
    }
}
