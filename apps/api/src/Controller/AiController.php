<?php
declare(strict_types=1);

namespace HomeScope\Controller;

use HomeScope\Http;
use HomeScope\Service\AiQuotaService;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

final class AiController
{
    public function __construct(private AiQuotaService $quota) {}

    public function authorize(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $userId = (int)$request->getAttribute('user_id');
        $quota = $this->quota->consume($userId);

        if (!$quota['allowed']) {
            return Http::error(
                $response,
                'AI_QUOTA_EXCEEDED',
                'AI advisor quota reached. Please try again later.',
                429,
                [
                    'minute_limit' => AiQuotaService::MINUTE_LIMIT,
                    'daily_limit' => AiQuotaService::DAILY_LIMIT,
                    'retry_after' => $quota['retry_after'],
                ],
            )->withHeader('Retry-After', (string)$quota['retry_after']);
        }

        return $response
            ->withStatus(204)
            ->withHeader('X-RateLimit-Limit-Minute', (string)AiQuotaService::MINUTE_LIMIT)
            ->withHeader('X-RateLimit-Remaining-Minute', (string)max(0, AiQuotaService::MINUTE_LIMIT - $quota['minute_count']))
            ->withHeader('X-RateLimit-Limit-Day', (string)AiQuotaService::DAILY_LIMIT)
            ->withHeader('X-RateLimit-Remaining-Day', (string)max(0, AiQuotaService::DAILY_LIMIT - $quota['daily_count']));
    }
}
