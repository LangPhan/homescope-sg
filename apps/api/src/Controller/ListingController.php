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
    public function index(ServerRequestInterface $request, ResponseInterface $response): ResponseInterface
    {
        $filters = $request->getQueryParams();
        foreach ($filters as $field => $value) {
            if (!is_string($value)) return Http::error($response, 'INVALID_FILTER', "Invalid $field.", 422);
        }
        foreach (['min_price','max_price','bedrooms','limit'] as $field) {
            if (isset($filters[$field]) && !ctype_digit($filters[$field])) return Http::error($response, 'INVALID_FILTER', "$field must be a positive integer.", 422);
        }
        if (isset($filters['near'])) {
            $coordinates = explode(',', $filters['near']);
            if (count($coordinates) !== 2 || !is_numeric($coordinates[0]) || !is_numeric($coordinates[1]) ||
                $coordinates[0] < 1.1 || $coordinates[0] > 1.6 || $coordinates[1] < 103.5 || $coordinates[1] > 104.2 || isset($filters['cursor'])) {
                return Http::error($response, 'INVALID_FILTER', 'Expected Singapore latitude,longitude without a cursor.', 422);
            }
        }
        ksort($filters);
        $key = 'listings:search:'.hash('sha256', json_encode($filters, JSON_THROW_ON_ERROR));
        return Http::json($response, $this->cache->remember($key, 30, fn() => $this->repository->search($filters)));
    }
    /** @param array<string,string> $args */
    public function show(ServerRequestInterface $request,ResponseInterface $response,array $args):ResponseInterface{$listing=$this->cache->remember('listings:detail:'.$args['slug'],60,fn()=>$this->repository->findBySlug($args['slug']));return $listing?Http::json($response,['data'=>$listing]):Http::error($response,'NOT_FOUND','Listing not found.',404);}
}
