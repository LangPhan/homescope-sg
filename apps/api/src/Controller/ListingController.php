<?php
declare(strict_types=1);
namespace HomeScope\Controller;
use HomeScope\Cache;
use HomeScope\Http;
use HomeScope\Repository\ListingRepository;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
final class ListingController
{
    public function __construct(private ListingRepository $repository,private Cache $cache){}
    public function index(ServerRequestInterface $request,ResponseInterface $response):ResponseInterface{$filters=$request->getQueryParams();foreach(['min_price','max_price','bedrooms','limit'] as $field)if(isset($filters[$field])&&!ctype_digit((string)$filters[$field]))return Http::error($response,'INVALID_FILTER',"{$field} must be a positive integer.",422,[$field=>'invalid']);$key='listings:search:'.hash('sha256',json_encode($filters));$result=$this->cache->remember($key,30,fn()=>$this->repository->search($filters));return Http::json($response,$result);}
    /** @param array<string,string> $args */
    public function show(ServerRequestInterface $request,ResponseInterface $response,array $args):ResponseInterface{$listing=$this->cache->remember('listings:detail:'.$args['slug'],60,fn()=>$this->repository->findBySlug($args['slug']));return $listing?Http::json($response,['data'=>$listing]):Http::error($response,'NOT_FOUND','Listing not found.',404);}
}
