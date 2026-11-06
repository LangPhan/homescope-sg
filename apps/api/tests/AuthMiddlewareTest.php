<?php
declare(strict_types=1);

namespace HomeScope\Tests;

use Firebase\JWT\JWT;
use HomeScope\Middleware\AuthMiddleware;
use PHPUnit\Framework\TestCase;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\RequestHandlerInterface;
use Slim\Psr7\Factory\ServerRequestFactory;
use Slim\Psr7\Response;

final class AuthMiddlewareTest extends TestCase
{
    public function testAiAuthorizationRequiresBearerToken(): void
    {
        $request = (new ServerRequestFactory())->createServerRequest('POST', '/api/v1/me/ai-authorize');
        $response = (new AuthMiddleware())->process($request, new UserIdHandler());
        self::assertSame(401, $response->getStatusCode());
    }

    public function testValidBearerTokenPassesUserIdToHandler(): void
    {
        $secret = getenv('JWT_SECRET') ?: 'local-development-secret-change-me';
        $token = JWT::encode(['sub' => 73, 'exp' => time() + 60], $secret, 'HS256');
        $request = (new ServerRequestFactory())->createServerRequest('POST', '/api/v1/me/ai-authorize')
            ->withHeader('Authorization', "Bearer {$token}");
        $response = (new AuthMiddleware())->process($request, new UserIdHandler());
        self::assertSame(204, $response->getStatusCode());
        self::assertSame('73', $response->getHeaderLine('X-Test-User'));
    }
}

final class UserIdHandler implements RequestHandlerInterface
{
    public function handle(ServerRequestInterface $request): ResponseInterface
    {
        return (new Response(204))->withHeader('X-Test-User', (string)$request->getAttribute('user_id'));
    }
}
