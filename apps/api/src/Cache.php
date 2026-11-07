<?php
declare(strict_types=1);
namespace HomeScope;

use Predis\Client;

final class Cache implements CounterStore
{
    private ?Client $client = null;
    public function __construct(private ?Metrics $metrics = null) {}
    private function client(): Client
    {
        return $this->client ??= new Client(['scheme' => 'tcp', 'host' => getenv('REDIS_HOST') ?: 'redis', 'port' => (int)(getenv('REDIS_PORT') ?: 6379), 'timeout' => 0.4]);
    }
    public function remember(string $key, int $ttl, callable $resolver): mixed
    {
        try { $cached = $this->client()->get($key); if ($cached !== null) { $this->metrics?->increment('cache_total',['result'],['hit']); return json_decode($cached, true, 512, JSON_THROW_ON_ERROR); } } catch (\Throwable) {}
        $this->metrics?->increment('cache_total',['result'],['miss']);
        $value = $resolver();
        try { $this->client()->setex($key, $ttl, json_encode($value, JSON_THROW_ON_ERROR)); } catch (\Throwable) {}
        return $value;
    }
    public function increment(string $key, int $ttl): int
    {
        try { $count = (int)$this->client()->incr($key); if ($count === 1) $this->client()->expire($key, $ttl); return $count; } catch (\Throwable) { return 1; }
    }
    public function ping(): bool
    {
        return (string)$this->client()->ping() === 'PONG';
    }
    public function flushListings(): void
    {
        try {
            foreach ($this->client()->keys('listings:*') as $key) $this->client()->del($key);
            $this->client()->incr('homescope:data-version');
        } catch (\Throwable) {}
    }
}
