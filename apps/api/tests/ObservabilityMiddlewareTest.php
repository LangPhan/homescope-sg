<?php
declare(strict_types=1);

namespace HomeScope\Tests;

use HomeScope\Middleware\RequestIdMiddleware;
use HomeScope\Middleware\RequestLogMiddleware;
use Monolog\Handler\TestHandler;
use Monolog\Logger;
use PHPUnit\Framework\TestCase;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;
use Slim\Psr7\Factory\ServerRequestFactory;
use Slim\Psr7\Response;

final class ObservabilityMiddlewareTest extends TestCase
{
    public function testRequestIdIsPropagatedAndInvalidInputIsReplaced(): void
    {
        $middleware = new RequestIdMiddleware();
        $valid = (new ServerRequestFactory())->createServerRequest('GET', '/health')->withHeader('X-Request-ID', 'trace-12345678');
        $response = $middleware->process($valid, new ObservabilityResponseHandler());
        self::assertSame('trace-12345678', $response->getHeaderLine('X-Request-ID'));

        $invalid = (new ServerRequestFactory())->createServerRequest('GET', '/health')->withHeader('X-Request-ID', 'short');
        $replacement = $middleware->process($invalid, new ObservabilityResponseHandler())->getHeaderLine('X-Request-ID');
        self::assertMatchesRegularExpression('/^[a-f0-9]{16}$/', $replacement);
    }

    public function testRequestLogContainsBoundedFieldsWithoutUriOrQuery(): void
    {
        $handler = new TestHandler();
        $logger = new Logger('test', [$handler]);
        $request = (new ServerRequestFactory())->createServerRequest('GET', '/listings/private-slug?email=hidden@example.com')
            ->withAttribute('request_id', 'trace-12345678');
        (new RequestLogMiddleware($logger))->process($request, new ObservabilityResponseHandler());
        $context = $handler->getRecords()[0]->context;

        self::assertSame('http_request', $context['event']);
        self::assertSame('trace-12345678', $context['request_id']);
        self::assertSame('unmatched', $context['route']);
        self::assertSame(204, $context['status']);
        self::assertStringNotContainsString('private-slug', json_encode($context, JSON_THROW_ON_ERROR));
        self::assertStringNotContainsString('hidden@example.com', json_encode($context, JSON_THROW_ON_ERROR));
    }
}

final class ObservabilityResponseHandler implements RequestHandlerInterface
{
    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        return new Response(204);
    }
}
