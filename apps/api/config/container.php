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
use Prometheus\CollectorRegistry;
use Prometheus\Storage\Predis as PrometheusPredis;

$builder=new ContainerBuilder();
$builder->addDefinitions([
    \PDO::class=>fn()=> (new Database())->connection(),
    ListingRepository::class=>fn($c)=>new ListingRepository($c->get(\PDO::class)),
    AuthService::class=>fn($c)=>new AuthService($c->get(\PDO::class)),
    CounterStore::class=>fn($c)=>$c->get(Cache::class),
    AiQuotaService::class=>fn($c)=>new AiQuotaService($c->get(CounterStore::class)),
    LoggerInterface::class=>fn()=>(new HomeScope\LoggerFactory())(),
    CollectorRegistry::class=>fn()=>new CollectorRegistry(new PrometheusPredis([
        'host'=>getenv('REDIS_HOST')?:'redis',
        'port'=>(int)(getenv('REDIS_PORT')?:6379),
        'timeout'=>0.4,
    ], ['prefix'=>'homescope:metrics:'])),
    HomeScope\Metrics::class=>fn($c)=>new HomeScope\Metrics($c->get(CollectorRegistry::class)),
    HomeScope\HealthService::class=>fn($c)=>new HomeScope\HealthService($c->get(\PDO::class),$c->get(Cache::class),$c->get(HomeScope\Metrics::class)),
]);
return $builder->build();
