<?php
declare(strict_types=1);
use HomeScope\Controller\AccountController;
use HomeScope\Controller\AiController;
use HomeScope\Controller\AuthController;
use HomeScope\Controller\ListingController;
use HomeScope\Http;
use HomeScope\Middleware\AuthMiddleware;
use HomeScope\Middleware\RateLimitMiddleware;
use HomeScope\Middleware\RequestIdMiddleware;
use Slim\Factory\AppFactory;
use Slim\Routing\RouteCollectorProxy;

require dirname(__DIR__).'/vendor/autoload.php';
if(file_exists(dirname(__DIR__,2).'/.env'))Dotenv\Dotenv::createImmutable(dirname(__DIR__,2))->safeLoad();
$container=require dirname(__DIR__).'/config/container.php';AppFactory::setContainer($container);$app=AppFactory::create();$app->setBasePath('/api');
$app->addBodyParsingMiddleware();$app->add(new RequestIdMiddleware());$app->add(new RateLimitMiddleware($container->get(HomeScope\Cache::class)));$app->addRoutingMiddleware();$errors=$app->addErrorMiddleware((getenv('APP_ENV')?:'local')!=='production',true,true);
$errors->setDefaultErrorHandler(function($request,Throwable $e,bool $display) { $response=new Slim\Psr7\Response(); error_log(json_encode(['level'=>'error','request_id'=>$_SERVER['REQUEST_ID']??null,'message'=>$e->getMessage()])); return Http::error($response,'INTERNAL_ERROR',$display?$e->getMessage():'The server could not complete the request.',500); });
$app->get('/docs',function($r,$res){$res->getBody()->write(file_get_contents(dirname(__DIR__).'/openapi.yaml'));return $res->withHeader('Content-Type','application/yaml');});
$app->group('/v1',function(RouteCollectorProxy $api) use($container){
    $api->get('/health',fn($r,$res)=>Http::json($res,['status'=>'ok','service'=>'homescope-api','time'=>gmdate(DATE_ATOM)]));
    $api->get('/listings',[ListingController::class,'index']);$api->get('/listings/{slug:[a-z0-9-]+}',[ListingController::class,'show']);
    $api->post('/auth/register',[AuthController::class,'register']);$api->post('/auth/login',[AuthController::class,'login']);$api->post('/auth/refresh',[AuthController::class,'refresh']);$api->post('/auth/logout',[AuthController::class,'logout']);
    $api->group('/me',function(RouteCollectorProxy $me){$me->post('/ai-authorize',[AiController::class,'authorize']);$me->get('/favourites',[AccountController::class,'favourites']);$me->post('/favourites/{id:[0-9]+}',[AccountController::class,'addFavourite']);$me->delete('/favourites/{id:[0-9]+}',[AccountController::class,'deleteFavourite']);$me->get('/saved-searches',[AccountController::class,'searches']);$me->post('/saved-searches',[AccountController::class,'addSearch']);$me->delete('/saved-searches/{id:[0-9]+}',[AccountController::class,'deleteSearch']);})->add(new AuthMiddleware());
});
$app->run();
