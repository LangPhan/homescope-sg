<?php
declare(strict_types=1);
namespace HomeScope;

use Predis\Client;

final class Cache implements CounterStore
{
    private ?Client $client = null;
    private function client(): Client
    {
        return $this->client ??= new Client(['scheme' => 'tcp', 'host' => getenv('REDIS_HOST') ?: 'redis', 'port' => (int)(getenv('REDIS_PORT') ?: 6379), 'timeout' => 0.4]);
    }
    public function remember(string $key, int $ttl, callable $resolver): mixed
    {
        try { $cached = $this->client()->get($key); if ($cached !== null) return json_decode($cached, true, 512, JSON_THROW_ON_ERROR); } catch (\Throwable) {}
        $value = $resolver();
        try { $this->client()->setex($key, $ttl, json_encode($value, JSON_THROW_ON_ERROR)); } catch (\Throwable) {}
        return $value;
    }
    public function increment(string $key, int $ttl): int
    {
        try { $count = (int)$this->client()->incr($key); if ($count === 1) $this->client()->expire($key, $ttl); return $count; } catch (\Throwable) { return 1; }
    }
    public function flushListings(): void { try { foreach ($this->client()->keys('listings:*') as $key) $this->client()->del($key); } catch (\Throwable) {} }
}
