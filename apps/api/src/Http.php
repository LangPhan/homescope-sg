<?php
declare(strict_types=1);
namespace HomeScope;

use Psr\Http\Message\ResponseInterface;

final class Http
{
    public static function json(ResponseInterface $response, mixed $data, int $status = 200): ResponseInterface
    {
        $response->getBody()->write(json_encode($data, JSON_UNESCAPED_SLASHES | JSON_UNESCAPED_UNICODE | JSON_THROW_ON_ERROR));
        return $response->withHeader('Content-Type', 'application/json')->withStatus($status);
    }
    /** @param array<string,mixed> $details */
    public static function error(ResponseInterface $response, string $code, string $message, int $status, array $details = []): ResponseInterface
    {
        return self::json($response, ['code' => $code, 'message' => $message, 'details' => $details, 'request_id' => $_SERVER['REQUEST_ID'] ?? null], $status);
    }
}
