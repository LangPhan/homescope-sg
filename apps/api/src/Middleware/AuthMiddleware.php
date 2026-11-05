<?php
declare(strict_types=1);
namespace HomeScope\Middleware;
use Firebase\JWT\JWT;
use Firebase\JWT\Key;
use HomeScope\Http;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
use Psr\Http\Server\MiddlewareInterface;
use Psr\Http\Server\RequestHandlerInterface;
use Slim\Psr7\Response;
final class AuthMiddleware implements MiddlewareInterface
{
    public function process(ServerRequestInterface $request, RequestHandlerInterface $handler): ResponseInterface
    {
        try { $header=$request->getHeaderLine('Authorization'); if(!str_starts_with($header,'Bearer ')) throw new \RuntimeException(); $claims=JWT::decode(substr($header,7),new Key(getenv('JWT_SECRET') ?: 'local-development-secret-change-me','HS256')); return $handler->handle($request->withAttribute('user_id',(int)$claims->sub)); }
        catch(\Throwable){ return Http::error(new Response(),'UNAUTHENTICATED','A valid access token is required.',401); }
    }
}
