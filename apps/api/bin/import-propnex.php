<?php
declare(strict_types=1);

$nullable = $db->query("SELECT COUNT(*) FROM information_schema.columns WHERE table_schema=DATABASE() AND table_name='listings' AND column_name IN ('tenure','mrt_distance') AND is_nullable='YES'")->fetchColumn();
if ((int)$nullable !== 2) {
    $db->exec("ALTER TABLE listings MODIFY tenure ENUM('99-year','999-year','Freehold') NULL, MODIFY mrt_distance SMALLINT UNSIGNED NULL");
}
$db->exec('CREATE TABLE IF NOT EXISTS listing_sources (listing_id BIGINT UNSIGNED PRIMARY KEY, url VARCHAR(500) NOT NULL, subtype VARCHAR(100) NOT NULL, FOREIGN KEY (listing_id) REFERENCES listings(id) ON DELETE CASCADE)');
$catalogue = json_decode(file_get_contents(dirname(__DIR__) . '/database/propnex-sale-map-sample.geojson'), true, 512, JSON_THROW_ON_ERROR);
if (count($catalogue['features']) !== 300 || count(array_unique(array_column($catalogue['features'], 'id'))) !== 300) {
    throw new RuntimeException('Expected 300 distinct PropNex listings.');
}
$db->exec("INSERT IGNORE INTO agents(name,registration_no,phone,avatar_url) VALUES ('PropNex source listing','PROPNEX-SOURCE','','')");
$agentId = $db->query("SELECT id FROM agents WHERE registration_no='PROPNEX-SOURCE'")->fetchColumn();
$insert = $db->prepare(<<<'SQL'
INSERT INTO listings
 (external_id,agent_id,slug,title,address,district,property_type,tenure,price,psf,bedrooms,bathrooms,floor_area,location,mrt_name,mrt_distance,image_url,images_json,amenities_json,description,is_featured,status,listed_at)
VALUES
 (:id,:agent,:slug,:title,:address,:district,:type,:tenure,:price,:psf,:beds,:baths,:area,ST_SRID(POINT(:lng,:lat),4326),:station,:distance,'/listing-placeholder.svg','[]','[]','',0,'published',:listed)
ON DUPLICATE KEY UPDATE title=VALUES(title),address=VALUES(address),district=VALUES(district),property_type=VALUES(property_type),
 tenure=VALUES(tenure),price=VALUES(price),psf=VALUES(psf),bedrooms=VALUES(bedrooms),bathrooms=VALUES(bathrooms),floor_area=VALUES(floor_area),
 location=VALUES(location),mrt_name=VALUES(mrt_name),mrt_distance=VALUES(mrt_distance),listed_at=VALUES(listed_at),status='published'
SQL);
$source = $db->prepare('INSERT INTO listing_sources(listing_id,url,subtype) SELECT id,:url,:subtype FROM listings WHERE external_id=:id ON DUPLICATE KEY UPDATE url=VALUES(url),subtype=VALUES(subtype)');
$db->beginTransaction();
try {
    $db->exec("UPDATE listings SET status='archived' WHERE external_id LIKE 'SYN-%' OR external_id LIKE 'propnex-%'");
    foreach ($catalogue['features'] as $feature) {
        $p = $feature['properties'];
        [$lng, $lat] = $feature['geometry']['coordinates'];
        $type = match ($p['property_filter']) {
            'hdb' => 'HDB',
            'landed' => 'Landed',
            'condo' => $p['property_type'] === 'Apartment' ? 'Apartment' : 'Condo',
        };
        $tenure = match (true) {
            str_contains(strtolower($p['tenure'] ?? ''), 'freehold') => 'Freehold',
            str_contains($p['tenure'] ?? '', '999') => '999-year',
            str_contains($p['tenure'] ?? '', '99') => '99-year',
            default => '',
        };
        $insert->execute([
            'id' => $feature['id'], 'agent' => $agentId, 'slug' => basename($p['listing_url']),
            'title' => $p['name'], 'address' => $p['address'], 'district' => $p['district'],
            'type' => $type, 'tenure' => $tenure ?: null, 'price' => $p['price'], 'psf' => round($p['psf'] ?? 0),
            'beds' => $p['bedrooms'] ?? 0, 'baths' => $p['bathrooms'] ?? 0, 'area' => $p['floor_area'] ?? 0,
            'lng' => $lng, 'lat' => $lat, 'station' => $p['mrt_name'] ?? '',
            'distance' => $p['mrt_distance'], 'listed' => $p['listed_at'],
        ]);
        $source->execute(['id' => $feature['id'], 'url' => $p['listing_url'], 'subtype' => $p['property_type'] ?? $type]);
    }
    $db->commit();
} catch (Throwable $error) {
    $db->rollBack();
    throw $error;
}
(new HomeScope\Cache())->flushListings();
