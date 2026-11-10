<?php
declare(strict_types=1);

namespace HomeScope\Tests;

use HomeScope\Controller\AiController;
use HomeScope\CounterStore;
use HomeScope\CounterStoreUnavailable;
use HomeScope\Middleware\RateLimitMiddleware;
use HomeScope\Service\AiQuotaService;
use PHPUnit\Framework\TestCase;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;
use Slim\Psr7\Factory\ServerRequestFactory;
use Slim\Psr7\Response;

final class CounterFailureTest extends TestCase
{
    public function testRateLimiterFailsClosedWhenCounterStorageIsUnavailable(): void
    {
        $middleware = new RateLimitMiddleware(new UnavailableCounterStore());
        $request = (new ServerRequestFactory())
            ->createServerRequest('GET', '/api/v1/listings', ['REMOTE_ADDR' => '127.0.0.1']);
        $handler = new CountingRequestHandler();

        $response = $middleware->process($request, $handler);

        self::assertSame(503, $response->getStatusCode());
        self::assertSame('5', $response->getHeaderLine('Retry-After'));
        self::assertSame(0, $handler->calls, 'The protected request must not reach its handler.');
        self::assertSame('RATE_LIMIT_UNAVAILABLE', self::responseJson($response)['code']);
    }

    public function testAiAuthorizationFailsClosedWhenQuotaStorageIsUnavailable(): void
    {
        $controller = new AiController(new AiQuotaService(new UnavailableCounterStore()));
        $request = (new ServerRequestFactory())
            ->createServerRequest('POST', '/api/v1/me/ai-authorize')
            ->withAttribute('user_id', 42);

        $response = $controller->authorize($request, new Response());

        self::assertSame(503, $response->getStatusCode());
        self::assertSame('5', $response->getHeaderLine('Retry-After'));
        self::assertSame('AI_QUOTA_UNAVAILABLE', self::responseJson($response)['code']);
    }

    /** @return array<string,mixed> */
    private static function responseJson(ResponseInterface $response): array
    {
        return json_decode((string)$response->getBody(), true, 512, JSON_THROW_ON_ERROR);
    }
}

final class UnavailableCounterStore implements CounterStore
{
    public function increment(string $key, int $ttl): int
    {
        throw new CounterStoreUnavailable('Redis unavailable.');
    }
}

final class CountingRequestHandler implements RequestHandlerInterface
{
    public int $calls = 0;

    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        $this->calls++;
        return new Response(204);
    }
}
