<?php

namespace StripeIntegration\Payments\Observer;

use Magento\Framework\Event\Observer;
use Magento\Payment\Observer\AbstractDataAssignObserver;
use StripeIntegration\Payments\Helper\Logger;

class OrderObserver extends AbstractDataAssignObserver
{
    private $helper;
    private $sessionManager;

    public function __construct(
        \StripeIntegration\Payments\Helper\Generic $helper,
        \Magento\Framework\Session\SessionManagerInterface $sessionManager
    )
    {
        $this->helper = $helper;
        $this->sessionManager = $sessionManager;
    }

    /**
     * @return void
     */
    public function execute(\Magento\Framework\Event\Observer $observer)
    {
        // When a guest customer order is placed in the admin area, clear the session saved variables so that new ones are created in the next session
        if ($this->helper->isAdmin())
            $this->sessionManager->setStripeCustomerId(null);
    }
}
