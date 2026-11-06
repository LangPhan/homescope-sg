<?php
declare(strict_types=1);

namespace HomeScope;

interface CounterStore
{
    public function increment(string $key, int $ttl): int;
}
