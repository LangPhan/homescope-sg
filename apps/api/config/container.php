<?php
declare(strict_types=1);
use DI\ContainerBuilder;
use HomeScope\Database;
use HomeScope\Repository\ListingRepository;
use HomeScope\Service\AuthService;

$builder=new ContainerBuilder();
$builder->addDefinitions([
    \PDO::class=>fn()=> (new Database())->connection(),
    ListingRepository::class=>fn($c)=>new ListingRepository($c->get(\PDO::class)),
    AuthService::class=>fn($c)=>new AuthService($c->get(\PDO::class)),
]);
return $builder->build();
