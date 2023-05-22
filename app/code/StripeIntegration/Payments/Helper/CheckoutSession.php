<?php

namespace StripeIntegration\Payments\Helper;

use Magento\Framework\Exception\LocalizedException;

class CheckoutSession
{
    private $config;
    private $paymentIntent;
    private $compare;
    private $status;
    private $localeHelper;
    private $stripeCouponFactory;
    private $customer;
    private $stripeCustomer;
    private $stripeProductFactory;
    private $stripePriceFactory;
    private $subscriptions;
    private $paymentsHelper;
    private $checkoutSessionFactory;
    private $scopeConfig;

    public function __construct(
        \StripeIntegration\Payments\Model\Config $config,
        \StripeIntegration\Payments\Model\PaymentIntent $paymentIntent,
        \StripeIntegration\Payments\Model\CheckoutSessionFactory $checkoutSessionFactory,
        \StripeIntegration\Payments\Model\Stripe\ProductFactory $stripeProductFactory,
        \StripeIntegration\Payments\Model\Stripe\PriceFactory $stripePriceFactory,
        \StripeIntegration\Payments\Model\Stripe\CouponFactory $stripeCouponFactory,
        \StripeIntegration\Payments\Helper\Generic $paymentsHelper,
        \StripeIntegration\Payments\Helper\Locale $localeHelper,
        \StripeIntegration\Payments\Helper\Subscriptions $subscriptions,
        \StripeIntegration\Payments\Helper\Compare $compare,
        \Magento\Framework\App\Config\ScopeConfigInterface $scopeConfig
    )
    {
        $this->config = $config;
        $this->paymentIntent = $paymentIntent;
        $this->checkoutSessionFactory = $checkoutSessionFactory;
        $this->stripeProductFactory = $stripeProductFactory;
        $this->stripePriceFactory = $stripePriceFactory;
        $this->stripeCouponFactory = $stripeCouponFactory;
        $this->paymentsHelper = $paymentsHelper;
        $this->localeHelper = $localeHelper;
        $this->subscriptions = $subscriptions;
        $this->compare = $compare;
        $this->customer = $paymentsHelper->getCustomerModel();
        $this->scopeConfig = $scopeConfig;
    }

    public function loadFromQuote($quote): ?\Stripe\Checkout\Session
    {
        try
        {
            $checkoutSessionId = $this->getCheckoutSessionIdFromQuote($quote);

            if ($checkoutSessionId)
                return $this->config->getStripeClient()->checkout->sessions->retrieve($checkoutSessionId, ['expand' => ['payment_intent']]);
            else
                return null;
        }
        catch (\Exception $e)
        {
            return null;
        }
    }

    public function getCheckoutSessionModel()
    {
        $quote = $this->paymentsHelper->getQuote();

        if (empty($quote) || empty($quote->getId()))
            return null;

        $checkoutSession = $this->checkoutSessionFactory->create()->load($quote->getId(), 'quote_id');

        return $checkoutSession;
    }

    public function getCheckoutSessionIdFromQuote($quote)
    {
        if (empty($quote) || empty($quote->getId()))
            return null;

        $checkoutSession = $this->checkoutSessionFactory->create()->load($quote->getId(), 'quote_id');

        return $checkoutSession->getCheckoutSessionId();
    }

    public function getOrderForQuote($quote)
    {
        if (empty($quote) || empty($quote->getId()))
            return null;

        $model = $this->checkoutSessionFactory->create()
            ->load($quote->getId(), 'quote_id');

        $orderIncrementId = $model->getOrderIncrementId();

        if (empty($orderIncrementId))
            return null;

        $order = $this->paymentsHelper->loadOrderByIncrementId($orderIncrementId);
        if ($order && $order->getId())
            return $order;

        return null;
    }

    public function cache($checkoutSession, $quote)
    {
        if (empty($quote) || empty($quote->getId()))
            return null;

        if (empty($checkoutSession) || empty($checkoutSession->id))
            return null;

        $this->checkoutSessionFactory->create()
            ->load($quote->getId(), 'quote_id')
            ->setQuoteId($quote->getId())
            ->setCheckoutSessionId($checkoutSession->id)
            ->save();
    }

    public function uncache($checkoutSessionId)
    {
        $this->checkoutSessionFactory->create()
            ->load($checkoutSessionId, 'checkout_session_id')
            ->delete();
    }

    public function updateCustomerEmail($email)
    {
        if (!filter_var($email, FILTER_VALIDATE_EMAIL))
        {
            // The email is invalid
            return;
        }

        if (!$this->config->isEnabled() || !$this->config->isRedirectPaymentFlow())
        {
            return;
        }

        if ($this->paymentsHelper->isCustomerLoggedIn())
        {
            // No need to update logged in customers
            return;
        }

        $checkoutSession = $this->load();

        if (!$checkoutSession)
        {
            return;
        }

        if (!empty($checkoutSession->customer_details->email) && $email != $checkoutSession->customer_details->email)
        {
            if ($checkoutSession->customer)
            {
                $this->config->getStripeClient()->customers->update($checkoutSession->customer, [
                    'email' => $email
                ]);
            }
        }
    }

    public function load(): ?\Stripe\Checkout\Session
    {
        $quote = $this->paymentsHelper->getQuote();
        $checkoutSession = $this->loadFromQuote($quote);
        $params = $this->getSessionParamsFromQuote($quote);

        if (!$checkoutSession)
        {
            return null;
        }
        else if ($this->hasChanged($checkoutSession, $params))
        {
            $this->cancelOrder($checkoutSession, __("The customer returned from Stripe and changed the cart details."));
            $this->cancel($checkoutSession);
            return null;
        }
        else if ($this->hasExpired($checkoutSession))
        {
            $this->cancelOrder($checkoutSession, __("The customer left from the payment page without paying."));
            $this->cancel($checkoutSession);
            return null;
        }

        return $checkoutSession;
    }

    public function getAvailablePaymentMethods()
    {
        $quote = $this->paymentsHelper->getQuote();
        $methods = [];

        try
        {
            $checkoutSession = $this->load();

            if (!$checkoutSession)
            {
                $params = $this->getSessionParamsFromQuote($quote);
                if (!empty($params["payment_intent_data"])) // In subscription mode, this is not set
                    $params["payment_intent_data"]["description"] = $this->paymentsHelper->getQuoteDescription($quote);

                $checkoutSession = $this->create($params, $quote);
            }

            if (!empty($checkoutSession->payment_method_types))
                $methods = $checkoutSession->payment_method_types;

            return $methods;
        }
        catch (\Exception $e)
        {
            $this->paymentsHelper->logError($e->getMessage());
            return ['An error has occurred.'];
        }
    }

    // Compares parameters which may affect which payment methods will be available at the Stripe Checkout landing page
    public function hasChanged($checkoutSession, $params)
    {
        if (isset($params["mode"]) && $params["mode"] == "subscription")
        {
            $comparisonParams = [
                "payment_intent" => "unset",
                "mode" => $params["mode"]
            ];
        }
        else
        {
            $comparisonParams = [
                "submit_type" => $params["submit_type"]
            ];

            if (!empty($params["payment_intent_data"]["capture_method"]))
                $comparisonParams["payment_intent"]["capture_method"] = $params["payment_intent_data"]["capture_method"];
            // else
                // is set as automatic or whatever the configured default is

            // Shipping country may affect payment methods
            if (!empty($params["payment_intent_data"]["shipping"]["address"]["country"]))
                $comparisonParams["payment_intent"]["shipping"]["address"]["country"] = $params["payment_intent_data"]["shipping"]["address"]["country"];
            else
                $comparisonParams["payment_intent"]["shipping"] = "unset";

            // Save customer card may affect payment methods
            if (!empty($params["payment_intent_data"]["setup_future_usage"]))
                $comparisonParams["payment_intent"]["setup_future_usage"] = $params["payment_intent_data"]["setup_future_usage"];
            else
                $comparisonParams["payment_intent"]["setup_future_usage"] = "unset";

            // Customer does not affect which payment methods are available, but it may do in the future based on Radar risk level or customer credit score
            if (!empty($params["customer"]))
                $comparisonParams["customer"] = $params["customer"];
        }

        if ($this->compare->isDifferent($checkoutSession, $comparisonParams))
            return true;

        $lineItems = $this->config->getStripeClient()->checkout->sessions->allLineItems($checkoutSession->id, ['limit' => 100]);
        if (count($lineItems->data) != count($params['line_items']))
            return true;

        $comparisonParams = [];
        foreach ($lineItems->data as $i => $item)
        {
            $comparisonParams[$i] = [
                'price' => [
                    'id' => $params['line_items'][$i]['price']
                ],
                'quantity' => $params['line_items'][$i]['quantity']
            ];

            if (!isset($params['line_items'][$i]['recurring']))
                $comparisonParams[$i]['price']['recurring'] = "unset";
            else
            {
                $comparisonParams[$i]['price']['recurring']['interval'] = $params['line_items'][$i]['recurring']['interval'];
                $comparisonParams[$i]['price']['recurring']['interval_count'] = $params['line_items'][$i]['recurring']['interval_count'];
            }
        }

        if ($this->compare->isDifferent($lineItems->data, $comparisonParams))
            return true;

        return false;
    }

    public function create($params, $quote)
    {
        if (empty($params))
            return null;

        $checkoutSession = $this->config->getStripeClient()->checkout->sessions->create($params);
        $this->cache($checkoutSession, $quote);
        return $checkoutSession;
    }

    public function canCancel(\Stripe\Checkout\Session $checkoutSession)
    {
        if (empty($checkoutSession->id))
            return false;

        if (in_array($checkoutSession->status, ["expired", "complete"]))
            return false;

        return true;
    }

    public function cancel($checkoutSession)
    {
        try
        {
            if ($this->canCancel($checkoutSession))
                $this->config->getStripeClient()->checkout->sessions->expire($checkoutSession->id, []);
        }
        catch (\Exception $e)
        {
            $this->paymentsHelper->logError("Cannot cancel checkout session: " . $e->getMessage());
        }

        if (!empty($checkoutSession->id))
            $this->uncache($checkoutSession->id);
    }

    protected function getExpirationTime()
    {
        $storeId = $this->paymentsHelper->getStoreId();
        $cookieLifetime = $this->scopeConfig->getValue("web/cookie/cookie_lifetime", \Magento\Store\Model\ScopeInterface::SCOPE_STORE, $storeId);
        $oneHour = 1 * 60 * 60;
        $twentyFourHours = 24 * 60 * 60;
        $cookieLifetime = max($oneHour, $cookieLifetime);
        $cookieLifetime = min($twentyFourHours, $cookieLifetime);
        $timeDifference = $this->paymentsHelper->getStripeApiTimeDifference();

        return time() + $cookieLifetime + $timeDifference;
    }

    protected function getSessionParamsFrom($lineItems, $subscription, $quote, $order = null)
    {
        $returnUrl = $this->paymentsHelper->getUrl('stripe/payment/index', ["payment_method" => "stripe_checkout"]);
        $cancelUrl = $this->paymentsHelper->getUrl('stripe/payment/cancel', ["payment_method" => "stripe_checkout"]);

        $params = [
            'expires_at' => $this->getExpirationTime(),
            'cancel_url' => $cancelUrl,
            'success_url' => $returnUrl,
            'locale' => $this->localeHelper->getStripeCheckoutLocale(),
            'line_items' => $lineItems
        ];

        if (!empty($subscription))
        {
            $params["mode"] = "subscription";
            $params["subscription_data"] = [
                "metadata" => $this->subscriptions->collectMetadataForSubscription($quote, $subscription, $order)
            ];

            $profile = $subscription['profile'];

            if ($profile['trial_days'] > 0)
                $params["subscription_data"]['trial_period_days'] = $profile['trial_days'];

            if ($profile['expiring_coupon'])
            {
                $coupon = $this->stripeCouponFactory->create()->fromSubscriptionProfile($profile);
                if ($coupon->getId())
                {
                    $params['discounts'][] = ['coupon' => $coupon->getId()];
                }
            }
        }
        else
        {
            $params["mode"] = "payment";
            $params["payment_intent_data"] = $this->convertToPaymentIntentData($this->paymentIntent->getParamsFrom($quote, $order), $quote);
            $params["submit_type"] = "pay";
        }

        $params["payment_method_options"] = [
            "acss_debit" => [
                "mandate_options" => [
                    "payment_schedule" => "sporadic",
                    "transaction_type" => "personal"
                ]
            ],
            // "bacs_debit" => [
            //     "setup_future_usage" => "off_session"
            // ]
        ];

        if ($this->config->alwaysSaveCards())
        {
            try
            {
                $this->customer->createStripeCustomerIfNotExists(false, $order);
                $this->stripeCustomer = $this->customer->retrieveByStripeID();
                if (!empty($this->stripeCustomer->id))
                    $params['customer'] = $this->stripeCustomer->id;
            }
            catch (\Stripe\Exception\CardException $e)
            {
                throw new LocalizedException(__($e->getMessage()));
            }
            catch (\Exception $e)
            {
                $this->paymentsHelper->dieWithError(__('An error has occurred. Please contact us to complete your order.'), $e);
            }
        }
        else
        {
            if ($this->paymentsHelper->isCustomerLoggedIn())
                $this->customer->createStripeCustomerIfNotExists(false, $order);

            $this->stripeCustomer = $this->customer->retrieveByStripeID();
            if (!empty($this->stripeCustomer->id))
                $params['customer'] = $this->stripeCustomer->id;
            else if ($order)
                $params['customer_email'] = $order->getCustomerEmail();
            else if ($quote->getCustomerEmail())
                $params['customer_email'] = $quote->getCustomerEmail();
        }

        return $params;
    }

    public function getSessionParamsFromQuote($quote)
    {
        if (empty($quote))
            throw new \Exception("No quote specified for Checkout params.");

        $subscription = $this->subscriptions->getSubscriptionFromQuote($quote);
        $lineItems = $this->getLineItemsForQuote($quote, $subscription);
        $params = $this->getSessionParamsFrom($lineItems, $subscription, $quote);

        return $params;
    }

    protected function getOneTimePayment($remainingAmount, $allSubscriptionsTotal, $currency)
    {
        if ($remainingAmount > 0)
        {
            if ($allSubscriptionsTotal > 0)
            {
                $productId = "one_time_payment";
                $name = __("One time payment");
            }
            else
            {
                $productId = "amount_due";
                $name = __("Amount due");
            }

            $metadata = [
                'Type' => 'RegularProductsTotal',
            ];

            $stripeAmount = $this->paymentsHelper->convertMagentoAmountToStripeAmount($remainingAmount, $currency);

            $stripeProductModel = $this->stripeProductFactory->create()->fromData($productId, $name, $metadata);
            $stripePriceModel = $this->stripePriceFactory->create()->fromData($stripeProductModel->getId(), $stripeAmount, $currency);

            $lineItem = [
                'price' => $stripePriceModel->getId(),
                'quantity' => 1,
            ];

            return $lineItem;
        }

        return null;
    }

    protected function getRecurringPayment($subscription, $subscriptionsProductIDs, $allSubscriptionsTotal, $currency, $interval, $intervalCount)
    {
        if (!empty($subscription['profile']) && $allSubscriptionsTotal > 0)
        {
            $profile = $subscription['profile'];

            $interval = $profile['interval'];
            $intervalCount = $profile['interval_count'];
            $currency = $profile['currency'];
            $magentoAmount = $this->subscriptions->getSubscriptionTotalWithDiscountAdjustmentFromProfile($profile);
            $stripeAmount = $this->paymentsHelper->convertMagentoAmountToStripeAmount($magentoAmount, $currency);

            if (!empty($subscription['quote_item']))
            {
                $stripeProductModel = $this->stripeProductFactory->create()->fromQuoteItem($subscription['quote_item']);
            }
            else if (!empty($subscription['order_item']))
            {
                $stripeProductModel = $this->stripeProductFactory->create()->fromOrderItem($subscription['order_item']);
            }
            else
            {
                throw new LocalizedException(__("Could not create subscription product in Stripe."));
            }

            $stripePriceModel = $this->stripePriceFactory->create()->fromData($stripeProductModel->getId(), $stripeAmount, $currency, $interval, $intervalCount);

            $lineItem = [
                'price' => $stripePriceModel->getId(),
                'quantity' => 1,

            ];

            return $lineItem;
        }

        return null;
    }

    protected function getLineItemsForQuote($quote, $subscription)
    {
        $currency = strtolower($quote->getQuoteCurrencyCode());
        $lines = [];
        $lineItemsTax = 0;
        $subscriptionsShipping = 0;

        $allSubscriptionsTotal = 0;
        $subscriptionsProductIDs = [];
        $interval = "month";
        $intervalCount = 1;
        if (!empty($subscription['profile']))
        {
            $profile = $subscription['profile'];
            $subscriptionsProductIDs[] = $subscription['product']->getId();
            $interval = $profile['interval'];
            $intervalCount = $profile['interval_count'];

            $subscriptionTotal = $this->subscriptions->getSubscriptionTotalFromProfile($profile);

            $allSubscriptionsTotal += $this->paymentsHelper->round(floatval($subscriptionTotal), 2);
        }

        $remainingAmount = $quote->getGrandTotal() - $allSubscriptionsTotal;

        $oneTimePayment = $this->getOneTimePayment($remainingAmount, $allSubscriptionsTotal, $currency);
        if ($oneTimePayment)
            $lines[] = $oneTimePayment;

        $recurringPayment = $this->getRecurringPayment($subscription, $subscriptionsProductIDs, $allSubscriptionsTotal, $currency, $interval, $intervalCount);
        if ($recurringPayment)
            $lines[] = $recurringPayment;

        if ($remainingAmount < 0 && $allSubscriptionsTotal > 0)
        {
            // A discount that should have been applied on subscriptions, has not been applied on subscriptions
        }

        return $lines;
    }

    protected function convertToPaymentIntentData($data, $quote)
    {
        $supportedParams = ['application_fee_amount', 'capture_method', 'description', 'metadata', 'on_behalf_of', 'receipt_email', 'setup_future_usage', 'shipping', 'statement_descriptor', 'statement_descriptor_suffix', 'transfer_data', 'transfer_group'];

        $params = [];

        $data['capture_method'] = $this->paymentIntent->getCaptureMethod();
        $futureUsage = $this->config->getSetupFutureUsage($quote);

        if ($futureUsage)
        {
            $data['setup_future_usage'] = $futureUsage;
        }

        foreach ($data as $key => $value)
            if (in_array($key, $supportedParams))
                $params[$key] = $value;

        return $params;
    }

    public function getSessionParamsForOrder($order)
    {
        $amount = $order->getGrandTotal();
        $currency = strtolower($order->getOrderCurrencyCode());
        $subscription = $this->subscriptions->getSubscriptionFromOrder($order);
        $lineItems = $this->getLineItemsForOrder($order, $subscription);

        $params = $this->getSessionParamsFrom($lineItems, $subscription, $order->getQuote(), $order);

        return $params;
    }

    public function getLineItemsForOrder($order, $subscription)
    {
        $currency = strtolower($order->getOrderCurrencyCode());
        $cents = $this->paymentsHelper->isZeroDecimal($currency) ? 1 : 100;
        $orderItems = $order->getAllVisibleItems();
        $lines = [];
        $lineItemsTax = 0;
        $subscriptionsShipping = 0;

        $allSubscriptionsTotal = 0;
        $subscriptionsProductIDs = [];
        $interval = "month";
        $intervalCount = 1;
        if (!empty($subscription['profile']))
        {
            $profile = $subscription['profile'];
            $subscriptionsProductIDs[] = $subscription['product']->getId();
            $interval = $profile['interval'];
            $intervalCount = $profile['interval_count'];

            $subscriptionTotal = $this->subscriptions->getSubscriptionTotalFromProfile($profile);

            $allSubscriptionsTotal += round(floatval($subscriptionTotal), 2);
        }

        $remainingAmount = $order->getGrandTotal() - $allSubscriptionsTotal;

        $oneTimePayment = $this->getOneTimePayment($remainingAmount, $allSubscriptionsTotal, $currency);
        if ($oneTimePayment)
            $lines[] = $oneTimePayment;

        $recurringPayment = $this->getRecurringPayment($subscription, $subscriptionsProductIDs, $allSubscriptionsTotal, $currency, $interval, $intervalCount);
        if ($recurringPayment)
            $lines[] = $recurringPayment;

        if ($remainingAmount < 0 && $allSubscriptionsTotal > 0)
        {
            // A discount that should have been applied on subscriptions, has not been applied on subscriptions
        }

        return $lines;
    }

    public function getPaymentIntentUpdateParams($params, $paymentIntent, $filterParams = [])
    {
        $updateParams = [];
        $allowedParams = ["amount", "currency", "description", "metadata"];

        foreach ($allowedParams as $key)
        {
            if (!empty($filterParams) && !in_array($key, $filterParams))
                continue;

            if (isset($params[$key]))
                $updateParams[$key] = $params[$key];
        }

        if (!empty($updateParams["amount"]) && $updateParams["amount"] == $paymentIntent->amount)
            unset($updateParams["amount"]);

        if (!empty($updateParams["currency"]) && $updateParams["currency"] == $paymentIntent->currency)
            unset($updateParams["currency"]);

        return $updateParams;
    }

    public function getLastTransactionId(\Magento\Payment\Model\InfoInterface $payment)
    {
        if ($payment->getLastTransId())
            return $this->paymentsHelper->cleanToken($payment->getLastTransId());

        if ($payment->getAdditionalInformation("checkout_session_id"))
        {
            $csId = $payment->getAdditionalInformation("checkout_session_id");
            $cs = $this->config->getStripeClient()->checkout->sessions->retrieve($csId, ['expand' => ['payment_intent', 'subscription']]);
            if (!empty($cs->payment_intent->id))
                return $cs->payment_intent->id;
        }

        return null;
    }

    public function cancelOrder($checkoutSession, $orderComment)
    {
        if (empty($checkoutSession->id))
            return;

        $checkoutSessionModel = $this->checkoutSessionFactory->create()->load($checkoutSession->id, 'checkout_session_id');

        if (!$checkoutSessionModel->getOrderIncrementId())
            return;

        $order = $this->paymentsHelper->loadOrderByIncrementId($checkoutSessionModel->getOrderIncrementId());
        if (!$order || !$order->getId())
            return;

        $state = \Magento\Sales\Model\Order::STATE_CANCELED;
        $status = $order->getConfig()->getStateDefaultStatus($state);
        $order->addStatusToHistory($status, $orderComment, $isCustomerNotified = false);
        $this->paymentsHelper->saveOrder($order);

        $checkoutSessionModel->setOrderIncrementId(null)->save();
    }

    public function hasExpired($checkoutSession)
    {
        return ($checkoutSession->status == "expired" || $checkoutSession->status == "complete");
    }
}
