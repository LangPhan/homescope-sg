<?php
declare(strict_types=1);
namespace HomeScope\Middleware;
use HomeScope\Cache;
use HomeScope\Http;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;
use Slim\Psr7\Response;
final class RateLimitMiddleware implements MiddlewareInterface
{
    public function __construct(private Cache $cache, private int $limit = 120) {}
    public function process(ServerRequestInterface $request, RequestHandlerInterface $handler): ResponseInterface
    {
        $ip = $request->getServerParams()['REMOTE_ADDR'] ?? 'unknown'; $window = (int)floor(time()/60); $count = $this->cache->increment("rate:{$ip}:{$window}", 90);
        if ($count > $this->limit) return Http::error(new Response(), 'RATE_LIMITED', 'Too many requests. Try again shortly.', 429);
        return $handler->handle($request)->withHeader('X-RateLimit-Limit', (string)$this->limit)->withHeader('X-RateLimit-Remaining', (string)max(0,$this->limit-$count));
    }
}
