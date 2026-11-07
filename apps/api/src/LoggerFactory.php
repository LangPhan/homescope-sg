<?php
declare(strict_types=1);

namespace HomeScope;

use Monolog\Formatter\JsonFormatter;
use Monolog\Handler\StreamHandler;
use Monolog\Level;
use Monolog\Logger;
use Monolog\LogRecord;
use Psr\Log\LoggerInterface;

final class LoggerFactory
{
    public function __invoke(): LoggerInterface
    {
        $handler = new StreamHandler('php://stderr', Level::Info);
        $handler->setFormatter(new JsonFormatter(JsonFormatter::BATCH_MODE_JSON, true));
        $logger = new Logger('homescope-api', [$handler]);
        $logger->pushProcessor(static function (LogRecord $record): LogRecord {
            return $record->with(extra: [
                ...$record->extra,
                'service' => 'api',
                'environment' => getenv('APP_ENV') ?: 'local',
            ]);
        });
        return $logger;
    }
}
