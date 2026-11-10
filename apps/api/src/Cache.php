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
        try {
            return (int)$this->client()->eval(
                "local count = redis.call('INCR', KEYS[1]); if count == 1 then redis.call('EXPIRE', KEYS[1], ARGV[1]); end; return count",
                1,
                $key,
                (string)$ttl,
            );
        } catch (\Throwable $error) {
            throw new CounterStoreUnavailable('Security counter storage is unavailable.', 0, $error);
        }
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
