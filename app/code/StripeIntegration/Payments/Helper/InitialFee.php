<?php

namespace StripeIntegration\Payments\Helper;

use StripeIntegration\Payments\Helper\Logger;
use Magento\Framework\Pricing\PriceCurrencyInterface;

class InitialFee
{
    public $serializer = null;
    protected $subscriptionUpdatesHelper = null;
    protected $subscriptionsHelper;
    private $subscriptionUpdatesHelperFactory;
    private $paymentsHelper;
    private $subscriptionsHelperFactory;

    public function __construct(
        \StripeIntegration\Payments\Helper\Generic $paymentsHelper,
        \StripeIntegration\Payments\Helper\SubscriptionUpdatesFactory $subscriptionUpdatesHelperFactory,
        \StripeIntegration\Payments\Helper\SubscriptionsFactory $subscriptionsHelperFactory
    ) {
        $this->paymentsHelper = $paymentsHelper;
        $this->subscriptionUpdatesHelperFactory = $subscriptionUpdatesHelperFactory;
        $this->subscriptionsHelperFactory = $subscriptionsHelperFactory;
    }

    public function getTotalInitialFeeForCreditmemo($creditmemo, $orderRate = true)
    {
        $payment = $creditmemo->getOrder()->getPayment();

        if (empty($payment))
            return 0;

        if (!$this->paymentsHelper->supportsSubscriptions($payment->getMethod()))
            return 0;

        if ($payment->getAdditionalInformation("is_recurring_subscription") || $payment->getAdditionalInformation("remove_initial_fee"))
            return 0;

        $items = $creditmemo->getAllItems();

        if ($orderRate)
            $rate = $creditmemo->getBaseToOrderRate();
        else
            $rate = 1;

        return $this->getInitialFeeForItems($items, $rate);
    }

    public function getTotalInitialFeeForInvoice($invoice, $invoiceRate = true)
    {
        $payment = $invoice->getOrder()->getPayment();

        if (empty($payment))
            return 0;

        if (!$this->paymentsHelper->supportsSubscriptions($payment->getMethod()))
            return 0;

        if ($payment->getAdditionalInformation("is_recurring_subscription") || $payment->getAdditionalInformation("remove_initial_fee"))
            return 0;

        $items = $invoice->getAllItems();

        if ($invoiceRate)
            $rate = $invoice->getBaseToOrderRate();
        else
            $rate = 1;

        return $this->getInitialFeeForItems($items, $rate);
    }

    public function getTotalInitialFeeForOrder($filteredOrderItems, $order): array
    {
        if ($order->getIsRecurringOrder() || $order->getRemoveInitialFee())
            return 0;

        if (!$this->subscriptionUpdatesHelper)
            $this->subscriptionUpdatesHelper = $this->subscriptionUpdatesHelperFactory->create();

        if ($this->subscriptionUpdatesHelper->getSubscriptionUpdateDetails())
            return 0;

        $baseTotal = $total = 0;

        foreach ($filteredOrderItems as $orderItem)
        {
            if ($orderItem->getInitialFee() > 0)
            {
                // From 3.4.0 onwards, the initial fee is saved on the order item
                $total += $orderItem->getInitialFee();
                $baseTotal += $orderItem->getBaseInitialFee();
            }
        }

        return [
            "initial_fee" => $total,
            "base_initial_fee" => $baseTotal
        ];
    }

    public function getTotalInitialFeeFor($items, $quote, $quoteRate = 1)
    {
        if ($quote->getIsRecurringOrder() || $quote->getRemoveInitialFee())
            return 0;

        return $this->getInitialFeeForItems($items, $quoteRate);
    }

    public function getInitialFeeForItems($items, $rate)
    {
        if (!$this->subscriptionUpdatesHelper)
            $this->subscriptionUpdatesHelper = $this->subscriptionUpdatesHelperFactory->create();

        if ($this->subscriptionUpdatesHelper->getSubscriptionUpdateDetails())
            return 0;

        $total = 0;

        foreach ($items as $item)
        {
            $qty = $this->paymentsHelper->getItemQty($item);
            $productId = $item->getProductId();
            $total += $this->getInitialFeeForProductId($productId, $rate, $qty);
        }
        return $total;
    }

    public function getInitialFeeForProductId($productId, $rate, $qty)
    {
        $product = $this->paymentsHelper->loadProductById($productId);

        if (!$product || !in_array($product->getTypeId(), ["simple", "virtual"]))
            return 0;

        if (!is_numeric($product->getStripeSubInitialFee()))
            return 0;

        return round(floatval($product->getStripeSubInitialFee() * $rate), 2) * $qty;
    }

    public function getAdditionalOptionsForChildrenOf($item)
    {
        $additionalOptions = array();

        foreach ($item->getQtyOptions() as $productId => $option)
        {
            $additionalOptions = array_merge($additionalOptions, $this->getAdditionalOptionsForProductId($productId, $item));
        }

        return $additionalOptions;
    }

    public function getAdditionalOptionsForProductId($productId, $quoteItem)
    {
        $qty = $quoteItem->getQty();

        $profile = $this->getSubscriptionProfileForProductId($productId, $quoteItem);
        if (!$profile)
            return array();

        $additionalOptions = array(
            array(
                'label' => 'Repeats Every',
                'value' => $profile['repeat_every']
            )
        );

        $quote = $this->paymentsHelper->getSessionQuote();

        if ($profile['initial_fee_magento'] && is_numeric($profile['initial_fee_magento']) && $profile['initial_fee_magento'] > 0)
        {
            $additionalOptions[] = array(
                'label' => 'Initial Fee',
                'value' => $this->paymentsHelper->addCurrencySymbol($profile['initial_fee_magento'])
            );
        }

        if ($profile['trial_days'] && is_numeric($profile['trial_days']) && $profile['trial_days'] > 0)
        {
            $additionalOptions[] = array(
                'label' => 'Trial Period',
                'value' => $profile['trial_days'] . " days"
            );
        }

        return $additionalOptions;
    }

    public function getSubscriptionProfileForProductId($productId, $quoteItem)
    {
        $product = $this->paymentsHelper->loadProductById($productId);

        if (!$this->getSubscriptionsHelper()->isSubscriptionProduct($product))
            return null;

        try
        {
            $quote = $this->paymentsHelper->getQuote();
            if (!$quote->getQuoteCurrencyCode())
            {
                $quote->beforeSave();
            }

            $profile = $this->getSubscriptionsHelper()->getSubscriptionDetails($product, $quote, $quoteItem);
        }
        catch (\StripeIntegration\Payments\Exception\InvalidSubscriptionProduct $e)
        {
            return null;
        }

        $intervalCount = $product->getStripeSubIntervalCount();
        $interval = ucfirst($product->getStripeSubInterval());
        $plural = ($intervalCount > 1 ? 's' : '');

        $profile['repeat_every'] = "$intervalCount $interval$plural";

        return $profile;
    }

    protected function getSubscriptionsHelper()
    {
        if (!$this->subscriptionsHelper)
        {
            $this->subscriptionsHelper = $this->subscriptionsHelperFactory->create();
        }

        return $this->subscriptionsHelper;
    }
}
