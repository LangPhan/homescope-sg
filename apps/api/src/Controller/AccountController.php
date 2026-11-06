<?php
declare(strict_types=1);
namespace HomeScope\Controller;
use HomeScope\Http;
use PDO;
use Psr\Http\Message\ResponseInterface;
use Psr\Http\Message\ServerRequestInterface;
final class AccountController
{
    public function __construct(private PDO $db){}
    public function favourites(ServerRequestInterface $r,ResponseInterface $res):ResponseInterface{$s=$this->db->prepare('SELECT l.id,l.slug,l.title,l.address,l.district,l.property_type,l.tenure,l.price,l.psf,l.bedrooms,l.bathrooms,l.floor_area,l.image_url,l.is_featured FROM favourites f JOIN listings l ON l.id=f.listing_id WHERE f.user_id=:user_id ORDER BY f.created_at DESC');$s->execute(['user_id'=>$r->getAttribute('user_id')]);return Http::json($res,['data'=>$s->fetchAll()]);}
    /** @param array<string,string> $a */
    public function addFavourite(ServerRequestInterface $r,ResponseInterface $res,array $a):ResponseInterface{$s=$this->db->prepare('INSERT IGNORE INTO favourites(user_id,listing_id) VALUES(:user_id,:listing_id)');$s->execute(['user_id'=>$r->getAttribute('user_id'),'listing_id'=>(int)$a['id']]);return $res->withStatus(204);}
    /** @param array<string,string> $a */
    public function deleteFavourite(ServerRequestInterface $r,ResponseInterface $res,array $a):ResponseInterface{$s=$this->db->prepare('DELETE FROM favourites WHERE user_id=:user_id AND listing_id=:listing_id');$s->execute(['user_id'=>$r->getAttribute('user_id'),'listing_id'=>(int)$a['id']]);return $res->withStatus(204);}
    public function searches(ServerRequestInterface $r,ResponseInterface $res):ResponseInterface{$s=$this->db->prepare('SELECT id,name,filters_json,created_at FROM saved_searches WHERE user_id=:user_id ORDER BY created_at DESC');$s->execute(['user_id'=>$r->getAttribute('user_id')]);$rows=$s->fetchAll();foreach($rows as &$row)$row['filters']=json_decode($row['filters_json'],true);return Http::json($res,['data'=>$rows]);}
    public function addSearch(ServerRequestInterface $r,ResponseInterface $res):ResponseInterface{$b=(array)json_decode((string)$r->getBody(),true);if(empty($b['name'])||!is_array($b['filters']??null))return Http::error($res,'VALIDATION_ERROR','A name and filters object are required.',422);$s=$this->db->prepare('INSERT INTO saved_searches(user_id,name,filters_json) VALUES(:user_id,:name,:filters)');$s->execute(['user_id'=>$r->getAttribute('user_id'),'name'=>substr($b['name'],0,100),'filters'=>json_encode($b['filters'])]);return Http::json($res,['data'=>['id'=>(int)$this->db->lastInsertId()]],201);}
    /** @param array<string,string> $a */
    public function deleteSearch(ServerRequestInterface $r,ResponseInterface $res,array $a):ResponseInterface{$s=$this->db->prepare('DELETE FROM saved_searches WHERE id=:id AND user_id=:user_id');$s->execute(['id'=>(int)$a['id'],'user_id'=>$r->getAttribute('user_id')]);return $res->withStatus(204);}
}
