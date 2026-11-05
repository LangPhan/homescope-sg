<?php
declare(strict_types=1);
namespace HomeScope\Repository;
use PDO;

final class ListingRepository
{
    public function __construct(private PDO $db) {}
    public function search(array $filters): array
    {
        $where=['l.status = :status']; $params=['status'=>'published'];
        if($q=$filters['q']??null){$where[]='(l.title LIKE :q OR l.address LIKE :q OR l.mrt_name LIKE :q)';$params['q']="%{$q}%";}
        foreach(['property_type','district','tenure'] as $field) if($value=$filters[$field]??null){$where[]="l.{$field} = :{$field}";$params[$field]=$value;}
        if($v=$filters['min_price']??null){$where[]='l.price >= :min_price';$params['min_price']=(int)$v;}
        if($v=$filters['max_price']??null){$where[]='l.price <= :max_price';$params['max_price']=(int)$v;}
        if($v=$filters['bedrooms']??null){$where[]='l.bedrooms >= :bedrooms';$params['bedrooms']=(int)$v;}
        if($v=$filters['cursor']??null){$decoded=json_decode(base64_decode($v,true)?:'',true);if(isset($decoded['listed_at'],$decoded['id'])){$where[]='(l.listed_at < :cursor_date OR (l.listed_at = :cursor_date AND l.id < :cursor_id))';$params['cursor_date']=$decoded['listed_at'];$params['cursor_id']=(int)$decoded['id'];}}
        if($bbox=$filters['bbox']??null){$coords=array_map('floatval',explode(',',$bbox));if(count($coords)===4){[$west,$south,$east,$north]=$coords;$where[]='MBRContains(ST_GeomFromText(:viewport,4326), l.location)';$params['viewport']="POLYGON(({$west} {$south},{$east} {$south},{$east} {$north},{$west} {$north},{$west} {$south}))";}}
        $sort=match($filters['sort']??'newest'){'price_asc'=>'l.price ASC, l.id DESC','price_desc'=>'l.price DESC, l.id DESC','psf_asc'=>'l.psf ASC, l.id DESC',default=>'l.listed_at DESC, l.id DESC'};
        $limit=min(50,max(1,(int)($filters['limit']??20))); $sql='SELECT l.id,l.slug,l.title,l.address,l.district,l.property_type,l.tenure,l.price,l.psf,l.bedrooms,l.bathrooms,l.floor_area,ST_Y(l.location) latitude,ST_X(l.location) longitude,l.mrt_name,l.mrt_distance,l.image_url,l.is_featured,l.listed_at FROM listings l WHERE '.implode(' AND ',$where)." ORDER BY {$sort} LIMIT ".($limit+1);
        $stmt=$this->db->prepare($sql);$stmt->execute($params);$rows=$stmt->fetchAll();$hasMore=count($rows)>$limit;if($hasMore)array_pop($rows);$last=end($rows);$cursor=$hasMore&&$last?base64_encode(json_encode(['listed_at'=>$last['listed_at'],'id'=>$last['id']])):null;
        $countSql='SELECT COUNT(*) FROM listings l WHERE '.implode(' AND ',array_filter($where,fn($item)=>!str_contains($item,'cursor_')));$countParams=array_filter($params,fn($key)=>!str_starts_with($key,'cursor_'),ARRAY_FILTER_USE_KEY);$count=$this->db->prepare($countSql);$count->execute($countParams);
        return ['data'=>$rows,'meta'=>['total'=>(int)$count->fetchColumn(),'next_cursor'=>$cursor,'request_id'=>$_SERVER['REQUEST_ID']??null]];
    }
    public function findBySlug(string $slug): ?array
    {
        $stmt=$this->db->prepare('SELECT l.*,ST_Y(l.location) latitude,ST_X(l.location) longitude,a.name agent_name,a.registration_no,a.phone,a.avatar_url FROM listings l JOIN agents a ON a.id=l.agent_id WHERE l.slug=:slug AND l.status="published" LIMIT 1');$stmt->execute(['slug'=>$slug]);$listing=$stmt->fetch();if(!$listing)return null;
        unset($listing['location']);$listing['amenities']=json_decode($listing['amenities_json'],true);unset($listing['amenities_json']);$listing['images']=json_decode($listing['images_json'],true);unset($listing['images_json']);$listing['agent']=['name'=>$listing['agent_name'],'registration_no'=>$listing['registration_no'],'phone'=>$listing['phone'],'avatar_url'=>$listing['avatar_url']];unset($listing['agent_name'],$listing['registration_no'],$listing['phone'],$listing['avatar_url']);
        $tx=$this->db->prepare('SELECT DATE_FORMAT(transaction_month,"%b %y") month,price,psf FROM transactions WHERE listing_id=:id ORDER BY transaction_month');$tx->execute(['id'=>$listing['id']]);$listing['transactions']=$tx->fetchAll();return $listing;
    }
}
