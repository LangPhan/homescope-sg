<?php
declare(strict_types=1);

namespace HomeScope\Tests;

use HomeScope\Metrics;
use PHPUnit\Framework\TestCase;
use Prometheus\CollectorRegistry;
use Prometheus\Storage\InMemory;

final class MetricsTest extends TestCase
{
    public function testRequestMetricsUseBoundedLabels(): void
    {
        $metrics = new Metrics(new CollectorRegistry(new InMemory(), false));
        $metrics->observeRequest('GET', '/v1/listings/{slug}', 200, 0.125);
        $metrics->dependency('mysql', true);
        $output = $metrics->render();

        self::assertStringContainsString('homescope_http_requests_total{method="GET",route="/v1/listings/{slug}",status_class="2xx"} 1', $output);
        self::assertStringContainsString('homescope_http_request_duration_seconds_bucket', $output);
        self::assertStringContainsString('homescope_dependency_up{dependency="mysql"} 1', $output);
    }
}
