<?php

namespace StripeIntegration\Payments\Plugin\Sales\Model\Order\Payment\State;

use Magento\Sales\Api\Data\OrderInterface;
use Magento\Sales\Api\Data\OrderPaymentInterface;
use Magento\Sales\Model\Order\StatusResolver;
use Magento\Framework\App\ObjectManager;

class AuthorizeCaptureCommand
{
    /**
     * @var StatusResolver
     */
    private $statusResolver;

    public function __construct(StatusResolver $statusResolver = null)
    {
        $this->statusResolver = $statusResolver
            ? : ObjectManager::getInstance()->get(StatusResolver::class);
    }

    public function aroundExecute($subject, \Closure $proceed, OrderPaymentInterface $payment, $amount, OrderInterface $order)
    {
        if ($payment->getMethod() == "stripe_payments")
        {
            if ($payment->getIsTransactionPending())
            {
                $state = 'pending_payment';
                $status = $this->statusResolver->getOrderStatusByState($order, $state);
                $message = __("The customer's bank requested customer authentication. Beginning the authentication process.");
                $order->setState($state);
                $order->setStatus($status);
                return __($message, $order->getBaseCurrency()->formatTxt($amount));
            }

            /** @var \Magento\Sales\Model\Order\Payment $payment */
            if ($payment->getAdditionalInformation("is_trial_subscription_setup"))
            {
                $state = 'processing';
                $status = $this->statusResolver->getOrderStatusByState($order, $state);
                $message = __("A trialing subscription has been set up.");
                $order->setState($state);
                $order->setStatus($status);
                return __($message, $order->getBaseCurrency()->formatTxt($amount));
            }
        }

        return $proceed($payment, $amount, $order);
    }
}
