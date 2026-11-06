<?php
declare(strict_types=1);

namespace HomeScope\Tests;

use HomeScope\CounterStore;
use HomeScope\Service\AiQuotaService;
use PHPUnit\Framework\TestCase;

final class AiQuotaServiceTest extends TestCase
{
    public function testMinuteQuotaAndTtlAreAppliedPerUser(): void
    {
        $store = new InMemoryCounterStore();
        $service = new AiQuotaService($store);
        $now = strtotime('2026-11-06 10:15:00 UTC');

        for ($request = 1; $request <= 10; $request++) {
            self::assertTrue($service->consume(42, $now)['allowed']);
        }
        $denied = $service->consume(42, $now);

        self::assertFalse($denied['allowed']);
        self::assertSame(60, $denied['retry_after']);
        self::assertContains(['ai:user:42:minute:202611061015', 90], $store->increments);
        self::assertContains(['ai:user:42:day:20261106', 90000], $store->increments);
        self::assertTrue($service->consume(7, $now)['allowed'], 'Quota must be isolated by user id.');
    }

    public function testDailyQuotaResetsWithUtcBucket(): void
    {
        $store = new InMemoryCounterStore();
        $service = new AiQuotaService($store);
        $day = strtotime('2026-11-06 00:00:00 UTC');

        for ($request = 0; $request < 100; $request++) {
            self::assertTrue($service->consume(9, $day + ($request * 61))['allowed']);
        }
        self::assertFalse($service->consume(9, $day + 7000)['allowed']);
        self::assertTrue($service->consume(9, strtotime('2026-11-07 00:00:01 UTC'))['allowed']);
    }
}

final class InMemoryCounterStore implements CounterStore
{
    /** @var array<string,int> */
    private array $counts = [];
    /** @var list<array{string,int}> */
    public array $increments = [];

    public function increment(string $key, int $ttl): int
    {
        $this->increments[] = [$key, $ttl];
        return $this->counts[$key] = ($this->counts[$key] ?? 0) + 1;
    }
}
