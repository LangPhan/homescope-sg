<?php
declare(strict_types=1);
require dirname(__DIR__).'/vendor/autoload.php';

$db=(new HomeScope\Database())->connection();$db->exec(file_get_contents(dirname(__DIR__).'/database/schema.sql'));
$user=$db->prepare('INSERT IGNORE INTO users(name,email,password_hash) VALUES(?,?,?)');
$user->execute(['Demo Explorer','demo@homescope.sg',password_hash('DemoPass123!',PASSWORD_ARGON2ID)]);
require __DIR__.'/import-propnex.php';
echo "Imported 300 PropNex listings.\n";
