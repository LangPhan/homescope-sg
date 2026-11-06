<?php
declare(strict_types=1);

namespace HomeScope\Controller;

use HomeScope\Cache;
use HomeScope\Http;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;

final class AiController
{
    private const MINUTE_LIMIT = 10;
    private const DAILY_LIMIT = 100;

    public function __construct(private Cache $cache) {}

    public function authorize(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $userId = (int)$request->getAttribute('user_id');
        $minuteBucket = gmdate('YmdHi');
        $dayBucket = gmdate('Ymd');
        $minuteCount = $this->cache->increment("ai:user:{$userId}:minute:{$minuteBucket}", 90);
        $dailyCount = $this->cache->increment("ai:user:{$userId}:day:{$dayBucket}", 90000);

        if ($minuteCount > self::MINUTE_LIMIT || $dailyCount > self::DAILY_LIMIT) {
            $retryAfter = $minuteCount > self::MINUTE_LIMIT ? 60 : $this->secondsUntilUtcMidnight();
            return Http::error(
                $response,
                'AI_QUOTA_EXCEEDED',
                'AI advisor quota reached. Please try again later.',
                429,
                [
                    'minute_limit' => self::MINUTE_LIMIT,
                    'daily_limit' => self::DAILY_LIMIT,
                    'retry_after' => $retryAfter,
                ],
            )->withHeader('Retry-After', (string)$retryAfter);
        }

        return $response
            ->withStatus(204)
            ->withHeader('X-RateLimit-Limit-Minute', (string)self::MINUTE_LIMIT)
            ->withHeader('X-RateLimit-Remaining-Minute', (string)max(0, self::MINUTE_LIMIT - $minuteCount))
            ->withHeader('X-RateLimit-Limit-Day', (string)self::DAILY_LIMIT)
            ->withHeader('X-RateLimit-Remaining-Day', (string)max(0, self::DAILY_LIMIT - $dailyCount));
    }

    private function secondsUntilUtcMidnight(): int
    {
        return max(1, strtotime('tomorrow UTC') - time());
    }
}
