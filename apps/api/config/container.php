<?php
declare(strict_types=1);
use DI\ContainerBuilder;
use HomeScope\Database;
use HomeScope\Cache;
use HomeScope\CounterStore;
use HomeScope\Repository\ListingRepository;
use HomeScope\Service\AuthService;
use HomeScope\Service\AiQuotaService;
use Psr\Log\LoggerInterface;

$builder=new ContainerBuilder();
$builder->addDefinitions([
    \PDO::class=>fn()=> (new Database())->connection(),
    ListingRepository::class=>fn($c)=>new ListingRepository($c->get(\PDO::class)),
    AuthService::class=>fn($c)=>new AuthService($c->get(\PDO::class)),
    CounterStore::class=>fn($c)=>$c->get(Cache::class),
    AiQuotaService::class=>fn($c)=>new AiQuotaService($c->get(CounterStore::class)),
    LoggerInterface::class=>fn()=>(new HomeScope\LoggerFactory())(),
]);
return $builder->build();
