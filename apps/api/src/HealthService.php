<?php
declare(strict_types=1);

namespace HomeScope;

use PDO;

final class HealthService
{
    public function __construct(private PDO $database, private Cache $cache, private Metrics $metrics) {}

    /** @return array{ready:bool,dependencies:array{mysql:string,redis:string}} */
    public function readiness(): array
    {
        $mysql = false;
        $redis = false;
        try { $mysql = $this->database->query('SELECT 1')->fetchColumn() === 1; } catch (\Throwable) {}
        try { $redis = $this->cache->ping(); } catch (\Throwable) {}
        $this->metrics->dependency('mysql', $mysql);
        $this->metrics->dependency('redis', $redis);
        return [
            'ready' => $mysql && $redis,
            'dependencies' => ['mysql' => $mysql ? 'up' : 'down', 'redis' => $redis ? 'up' : 'down'],
        ];
    }
}
