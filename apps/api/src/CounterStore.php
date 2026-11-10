<?php
declare(strict_types=1);

namespace HomeScope;

interface CounterStore
{
    /** @throws CounterStoreUnavailable */
    public function increment(string $key, int $ttl): int;
}
