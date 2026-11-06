<?php
declare(strict_types=1);
namespace HomeScope\Repository;
use PDO;

final class ListingRepository
{
    public function __construct(private PDO $db) {}
    /**
     * @param array<string,string> $filters
     * @return array<string,mixed>
     */
    public function search(array $filters): array
    {
        $where=['l.status = :status']; $params=['status'=>'published'];
        if($q=trim((string)($filters['q']??''))){$where[]='(l.title LIKE :q_title OR l.address LIKE :q_address OR l.mrt_name LIKE :q_mrt)';$term="%{$q}%";$params['q_title']=$term;$params['q_address']=$term;$params['q_mrt']=$term;}
        foreach(['property_type','district','tenure'] as $field) if($value=$filters[$field]??null){$where[]="l.{$field} = :{$field}";$params[$field]=$value;}
        if (!empty($filters['subtype'])) {
            $where[] = 's.subtype = :subtype';
            $params['subtype'] = $filters['subtype'];
        }
        if($v=$filters['min_price']??null){$where[]='l.price >= :min_price';$params['min_price']=(int)$v;}
        if($v=$filters['max_price']??null){$where[]='l.price <= :max_price';$params['max_price']=(int)$v;}
        if($v=$filters['bedrooms']??null){$where[]='l.bedrooms >= :bedrooms';$params['bedrooms']=(int)$v;}
        $sortKey=$filters['sort']??'newest'; $sortConfig=match($sortKey){'price_asc'=>['price','ASC'],'price_desc'=>['price','DESC'],'psf_asc'=>['psf','ASC'],default=>['listed_at','DESC']}; [$sortField,$sortDirection]=$sortConfig;
        if($bbox=$filters['bbox']??null){$coords=array_map('floatval',explode(',',$bbox));if(count($coords)===4){[$west,$south,$east,$north]=$coords;$where[]='MBRContains(ST_GeomFromText(:viewport,4326), l.location)';$params['viewport']="POLYGON(({$south} {$west},{$south} {$east},{$north} {$east},{$north} {$west},{$south} {$west}))";}}
        $from = ' FROM listings l LEFT JOIN listing_sources s ON s.listing_id=l.id';
        $distance = 'NULL';
        if (isset($filters['near'])) {
            [$lat, $lng] = explode(',', $filters['near']);
            $from .= ' CROSS JOIN (SELECT ST_SRID(POINT(:near_lng,:near_lat),4326) AS point) anchor';
            $params['near_lat'] = (float)$lat;
            $params['near_lng'] = (float)$lng;
            $distance = 'ST_Distance_Sphere(l.location,anchor.point)';
            $where[] = "$distance <= 3000";
            $where[] = 's.url IS NOT NULL';
        }
        $countWhere=$where; $countParams=$params;
        if($v=$filters['cursor']??null){$decoded=json_decode(base64_decode($v,true)?:'',true);$cursorValue=$decoded['value']??$decoded['listed_at']??null;if($cursorValue!==null&&isset($decoded['id'])){$operator=$sortDirection==='ASC'?'>':'<';$where[]="(l.{$sortField} {$operator} :cursor_value OR (l.{$sortField} = :cursor_value_equal AND l.id < :cursor_id))";$params['cursor_value']=$cursorValue;$params['cursor_value_equal']=$cursorValue;$params['cursor_id']=(int)$decoded['id'];}}
        $sort="l.{$sortField} {$sortDirection}, l.id DESC";
        if (isset($filters['near'])) $sort = 'distance_m ASC, l.id DESC';
        $maxLimit = ($filters['view'] ?? '') === 'map' ? 300 : 50;
        $limit=min($maxLimit,max(1,(int)($filters['limit']??20)));
        $sql='SELECT l.id,l.slug,l.title,l.address,l.district,l.property_type,l.tenure,l.price,l.psf,l.bedrooms,l.bathrooms,l.floor_area,ST_X(l.location) latitude,ST_Y(l.location) longitude,l.mrt_name,l.mrt_distance,l.image_url,l.is_featured,l.listed_at,s.url source_url,s.subtype,ROUND('.$distance.') distance_m'.$from.' WHERE '.implode(' AND ',$where)." ORDER BY {$sort} LIMIT ".($limit+1);
        $stmt=$this->db->prepare($sql);$stmt->execute($params);$rows=$stmt->fetchAll();$hasMore=count($rows)>$limit;if($hasMore)array_pop($rows);$last=end($rows);$cursor=$hasMore&&$last?base64_encode(json_encode(['sort'=>$sortKey,'value'=>$last[$sortField],'id'=>$last['id']])):null;
        if (isset($filters['near'])) $cursor = null;
        $countSql='SELECT COUNT(*)'.$from.' WHERE '.implode(' AND ',$countWhere);$count=$this->db->prepare($countSql);$count->execute($countParams);
        return ['data'=>$rows,'meta'=>['total'=>(int)$count->fetchColumn(),'next_cursor'=>$cursor,'request_id'=>$_SERVER['REQUEST_ID']??null]];
    }
    /** @return array<string,mixed>|null */
    public function findBySlug(string $slug): ?array
    {
        $stmt=$this->db->prepare('SELECT l.*,ST_X(l.location) latitude,ST_Y(l.location) longitude,s.url source_url,s.subtype,a.name agent_name,a.registration_no,a.phone,a.avatar_url FROM listings l JOIN agents a ON a.id=l.agent_id LEFT JOIN listing_sources s ON s.listing_id=l.id WHERE l.slug=:slug AND l.status="published" LIMIT 1');$stmt->execute(['slug'=>$slug]);$listing=$stmt->fetch();if(!$listing)return null;
        unset($listing['location']);$listing['amenities']=json_decode($listing['amenities_json'],true);unset($listing['amenities_json']);$listing['images']=json_decode($listing['images_json'],true);unset($listing['images_json']);$listing['agent']=['name'=>$listing['agent_name'],'registration_no'=>$listing['registration_no'],'phone'=>$listing['phone'],'avatar_url'=>$listing['avatar_url']];unset($listing['agent_name'],$listing['registration_no'],$listing['phone'],$listing['avatar_url']);
        $tx=$this->db->prepare('SELECT DATE_FORMAT(transaction_month,"%b %y") month,price,psf FROM transactions WHERE listing_id=:id ORDER BY transaction_month');$tx->execute(['id'=>$listing['id']]);$listing['transactions']=$tx->fetchAll();return $listing;
    }
}
