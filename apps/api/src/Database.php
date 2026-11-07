<?php
declare(strict_types=1);
namespace HomeScope;

use PDO;

final class Database
{
    private ?PDO $connection = null;
    public function connection(): PDO
    {
        if ($this->connection) return $this->connection;
        $host = getenv('DB_HOST') ?: 'mysql';
        $port = getenv('DB_PORT') ?: '3306';
        $database = getenv('DB_DATABASE') ?: 'homescope';
        $this->connection = new PDO("mysql:host={$host};port={$port};dbname={$database};charset=utf8mb4", getenv('DB_USERNAME') ?: 'homescope', getenv('DB_PASSWORD') ?: 'homescope', [
            PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
            PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
            PDO::ATTR_EMULATE_PREPARES => false,
            PDO::ATTR_TIMEOUT => 1,
        ]);
        return $this->connection;
    }
}
