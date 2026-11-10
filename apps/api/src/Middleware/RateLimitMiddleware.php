<?php
declare(strict_types=1);
namespace HomeScope\Middleware;
use HomeScope\CounterStore;
use HomeScope\CounterStoreUnavailable;
use HomeScope\Http;
use HomeScope\Metrics;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;
use Slim\Psr7\Response;
final class RateLimitMiddleware implements MiddlewareInterface
{
    public function __construct(private CounterStore $counterStore, private int $limit = 120, private ?Metrics $metrics = null) {}
    public function process(ServerRequestInterface $request, RequestHandlerInterface $handler): ResponseInterface
    {
        $ip = $request->getServerParams()['REMOTE_ADDR'] ?? 'unknown';
        $window = (int)floor(time()/60);
        try {
            $count = $this->counterStore->increment("rate:{$ip}:{$window}", 90);
        } catch (CounterStoreUnavailable) {
            $this->metrics?->increment('rate_limit_total', ['outcome'], ['unavailable']);
            return Http::error(new Response(), 'RATE_LIMIT_UNAVAILABLE', 'Request protection is temporarily unavailable.', 503)
                ->withHeader('Retry-After', '5');
        }
        if ($count > $this->limit) { $this->metrics?->increment('rate_limit_total', ['outcome'], ['blocked']); return Http::error(new Response(), 'RATE_LIMITED', 'Too many requests. Try again shortly.', 429); }
        $this->metrics?->increment('rate_limit_total', ['outcome'], ['allowed']);
        return $handler->handle($request)->withHeader('X-RateLimit-Limit', (string)$this->limit)->withHeader('X-RateLimit-Remaining', (string)max(0,$this->limit-$count));
    }
}
