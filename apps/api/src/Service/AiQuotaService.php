<?php
declare(strict_types=1);

namespace HomeScope\Service;

use HomeScope\CounterStore;

final class AiQuotaService
{
    public const MINUTE_LIMIT = 10;
    public const DAILY_LIMIT = 100;

    public function __construct(private CounterStore $store) {}

    /** @return array{allowed:bool,minute_count:int,daily_count:int,retry_after:int} */
    public function consume(int $userId, ?int $timestamp = null): array
    {
        $now = $timestamp ?? time();
        $minuteBucket = gmdate('YmdHi', $now);
        $dayBucket = gmdate('Ymd', $now);
        $minuteCount = $this->store->increment("ai:user:{$userId}:minute:{$minuteBucket}", 90);
        $dailyCount = $this->store->increment("ai:user:{$userId}:day:{$dayBucket}", 90000);
        $allowed = $minuteCount <= self::MINUTE_LIMIT && $dailyCount <= self::DAILY_LIMIT;
        $retryAfter = $minuteCount > self::MINUTE_LIMIT
            ? 60
            : max(1, strtotime('tomorrow UTC', $now) - $now);

        return [
            'allowed' => $allowed,
            'minute_count' => $minuteCount,
            'daily_count' => $dailyCount,
            'retry_after' => $retryAfter,
        ];
    }
}
