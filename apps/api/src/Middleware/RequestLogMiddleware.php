<?php
declare(strict_types=1);

namespace HomeScope\Middleware;

use HomeScope\Metrics;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;
use Psr\Log\LoggerInterface;
use Slim\Routing\RouteContext;

final class RequestLogMiddleware implements MiddlewareInterface
{
    public function __construct(private LoggerInterface $logger, private ?Metrics $metrics = null) {}

    public function process(ServerRequestInterface $request, RequestHandlerInterface $handler): ResponseInterface
    {
        $startedAt = hrtime(true);
        try {
            $response = $handler->handle($request);
            $route = self::routeLabel($request);
            $durationSeconds = (hrtime(true) - $startedAt) / 1_000_000_000;
            $this->metrics?->observeRequest($request->getMethod(), $route, $response->getStatusCode(), $durationSeconds);
            $this->logger->info('http_request', [
                'event' => 'http_request',
                'request_id' => (string)$request->getAttribute('request_id', ''),
                'method' => $request->getMethod(),
                'route' => $route,
                'status' => $response->getStatusCode(),
                'status_class' => intdiv($response->getStatusCode(), 100).'xx',
                'duration_ms' => round((hrtime(true) - $startedAt) / 1_000_000, 2),
            ]);
            return $response;
        } catch (\Throwable $error) {
            $route = self::routeLabel($request);
            $this->metrics?->observeRequest($request->getMethod(), $route, 500, (hrtime(true) - $startedAt) / 1_000_000_000);
            $this->logger->error('http_request_failed', [
                'event' => 'http_request_failed',
                'request_id' => (string)$request->getAttribute('request_id', ''),
                'method' => $request->getMethod(),
                'route' => $route,
                'error_type' => $error::class,
                'duration_ms' => round((hrtime(true) - $startedAt) / 1_000_000, 2),
            ]);
            throw $error;
        }
    }

    public static function routeLabel(ServerRequestInterface $request): string
    {
        try {
            $route = RouteContext::fromRequest($request)->getRoute();
        } catch (\RuntimeException) {
            return 'unmatched';
        }
        $pattern = $route?->getPattern() ?: 'unmatched';
        return preg_replace('/\{([a-zA-Z0-9_]+):[^}]+\}/', '{$1}', $pattern) ?: 'unmatched';
    }
}
