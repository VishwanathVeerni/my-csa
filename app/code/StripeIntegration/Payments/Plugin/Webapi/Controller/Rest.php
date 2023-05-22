<?php

namespace StripeIntegration\Payments\Plugin\Webapi\Controller;

class Rest
{
    public function afterDispatch(
        $subject,
        $response, // result
        \Magento\Framework\App\RequestInterface $request
    ) {
        try
        {
            $exceptions = $response->getException();

            foreach ($exceptions as $exception)
            {
                if (!empty($exception) && $this->isAuthenticationRequiredMessage($exception->getMessage()))
                {
                    $response->clearHeader('errorRedirectAction');
                }
            }
        }
        catch (\Exception $e)
        {

        }

        return $response;
    }

    public function isAuthenticationRequiredMessage($message)
    {
        return (strpos($message, "Authentication Required: ") !== false);
    }
}
