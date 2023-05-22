<?php

namespace StripeIntegration\Payments\Model\Stripe;

use Magento\Framework\Exception\LocalizedException;

class Coupon extends StripeObject
{
    protected $objectSpace = 'coupons';
    public $rule = null;
    public $coupon = null;

    public function fromOrder($order)
    {
        $currency = $order->getOrderCurrencyCode();
        $amount = abs($order->getDiscountAmount());
        $couponCode = $order->getCouponCode();
        $hasSubscriptions = $this->helper->hasSubscriptionsIn($order->getAllItems());
        $data = $this->getCouponParams($amount, $currency, $couponCode, $hasSubscriptions);

        if (!$data)
            return $this;

        $this->getObject($data['id']);

        if (!$this->object)
            $this->createObject($data);

        if (!$this->object)
            throw new \Magento\Framework\Exception\LocalizedException(__("The discount for order #%1 could not be created in Stripe: %2", $order->getIncrementId(), $this->lastError));

        return $this;
    }

    public function fromSubscriptionProfile($profile)
    {
        $currency = $profile['currency'];
        $amount = $profile['discount_amount_magento'];
        $couponCode = $profile['expiring_coupon']['coupon_code'];
        $data = $this->getCouponParams($amount, $currency, $couponCode, true);

        if (!$data)
            return $this;

        $this->getObject($data['id']);

        if (!$this->object)
            $this->createObject($data);

        if (!$this->object)
            throw new \Magento\Framework\Exception\LocalizedException(__("The discount could not be created in Stripe: %2", $this->lastError));

        return $this;
    }
    public function fromGiftCards($order)
    {
        $currency = $order->getOrderCurrencyCode();
        $amount = $order->getGiftCardsAmount();

        $discountType = "amount_off";
        $stripeAmount = $this->helper->convertMagentoAmountToStripeAmount($amount, $currency);

        $giftCards = json_decode($order->getGiftCards());
        if (count($giftCards) > 1)
        {
            $name = __("%1 Gift Cards", $this->helper->addCurrencySymbol($amount, $currency));
        }
        else
        {
            $name = __("%1 Gift Card", $this->helper->addCurrencySymbol($amount, $currency));
        }

        $params = [
            $discountType => $stripeAmount,
            'currency' => $currency,
            'name' => $name
        ];

        $this->createObject($params);

        if (!$this->object)
            throw new \Magento\Framework\Exception\LocalizedException(__("The gift cards for order #%1 could not be created in Stripe: %2", $order->getIncrementId(), $this->lastError));

        return $this;
    }

    public function fromOrderItem($order, $orderItem)
    {
        $currency = $order->getOrderCurrencyCode();
        $amount = abs($orderItem->getDiscountAmount());
        $couponCode = $order->getCouponCode();
        $hasSubscriptions = $this->helper->hasSubscriptionsIn($order->getAllItems());
        $data = $this->getCouponParams($amount, $currency, $couponCode, $hasSubscriptions);

        if (!$data)
            return $this;

        $this->getObject($data['id']);

        if (!$this->object)
            $this->createObject($data);

        if (!$this->object)
            throw new \Magento\Framework\Exception\LocalizedException(__("The discount for %1 could not be created in Stripe: %2", $orderItem->getName(), $this->lastError));

        return $this;
    }

    public function getCouponExpirationParams($ruleId)
    {
        $defaults = ['duration' => 'forever'];

        if (empty($ruleId))
            return $defaults;

        $coupon = $this->helper->loadStripeCouponByRuleId($ruleId);
        $duration = $coupon->duration();
        $months = $coupon->months();

        if ($months && $months > 0)
        {
            return [
                'duration' => $duration,
                'duration_in_months' => $months
            ];
        }

        return ['duration' => $duration];
    }

    public function getCouponParams($amount, $currency, $couponCode, $hasSubscriptions)
    {
        if (empty($amount) || empty($couponCode))
            return null;

        $this->coupon = $coupon = $this->helper->loadCouponByCouponCode($couponCode);
        if (!$coupon->getRuleId())
            return null;

        $this->rule = $rule = $this->helper->loadRuleByRuleId($coupon->getRuleId());
        $action = $rule->getSimpleAction();
        if (empty($action))
            return null;

        if (!$hasSubscriptions)
            $action = "by_fixed";

        $discountType = "amount_off";
        $stripeAmount = $this->helper->convertMagentoAmountToStripeAmount($amount, $currency);
        $couponId = ((string)$stripeAmount) . strtoupper($currency);
        $name = $this->helper->addCurrencySymbol($amount, $currency) . " Discount";

        $expirationParams = $this->getCouponExpirationParams($coupon->getRuleId());

        switch ($expirationParams['duration'])
        {
            case 'repeating':
                $couponId .= "-months-" . $expirationParams['duration_in_months'];
                break;
            case 'once':
                $couponId .= "-once";
                break;
        }

        $params = [
            'id' => $couponId,
            $discountType => $stripeAmount,
            'currency' => $currency,
            'name' => $name
        ];

        $params = array_merge($params, $expirationParams);

        return $params;
    }

    public function getApplyToShipping()
    {
        if (!empty($this->rule))
        {
            return $this->rule->getApplyToShipping();
        }

        return false;
    }
}
