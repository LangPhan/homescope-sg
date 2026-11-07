<?php
declare(strict_types=1);

namespace HomeScope;

use Prometheus\CollectorRegistry;
use Prometheus\RenderTextFormat;

final class Metrics
{
    public function __construct(private CollectorRegistry $registry) {}

    public function observeRequest(string $method, string $route, int $status, float $durationSeconds): void
    {
        try {
            $labels = [strtoupper($method), $route, intdiv($status, 100).'xx'];
            $this->registry->getOrRegisterCounter('homescope', 'http_requests_total', 'HTTP requests handled by the PHP API.', ['method', 'route', 'status_class'])->inc($labels);
            $this->registry->getOrRegisterHistogram('homescope', 'http_request_duration_seconds', 'PHP API request duration.', ['method', 'route', 'status_class'], [0.01, 0.025, 0.05, 0.1, 0.25, 0.5, 1, 2.5, 5])->observe($durationSeconds, $labels);
        } catch (\Throwable) {}
    }

    public function dependency(string $name, bool $up): void
    {
        try {
            $this->registry->getOrRegisterGauge('homescope', 'dependency_up', 'Whether a required application dependency is reachable.', ['dependency'])->set($up ? 1 : 0, [$name]);
        } catch (\Throwable) {}
    }

    /**
     * @param list<string> $labelNames
     * @param list<string|int|float> $labelValues
     */
    public function increment(string $name, array $labelNames = [], array $labelValues = []): void
    {
        try {
            $this->registry->getOrRegisterCounter('homescope', $name, "HomeScope {$name} events.", $labelNames)->inc($labelValues);
        } catch (\Throwable) {}
    }

    public function render(): string
    {
        return (new RenderTextFormat())->render($this->registry->getMetricFamilySamples());
    }
}
