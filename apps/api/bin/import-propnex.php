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
$agents = [
    ['Jamie Tan', 'R063400Z', '+65 6123 4567', 'https://i.pravatar.cc/160?img=12'],
    ['Nadia Lim', 'R063401Z', '+65 6123 4568', 'https://i.pravatar.cc/160?img=32'],
    ['Marcus Goh', 'R063402Z', '+65 6123 4569', 'https://i.pravatar.cc/160?img=52'],
    ['Aisha Rahman', 'R063403Z', '+65 6123 4570', 'https://i.pravatar.cc/160?img=47'],
];
$agentStatement = $db->prepare('INSERT INTO agents(name,registration_no,phone,avatar_url) VALUES(?,?,?,?) ON DUPLICATE KEY UPDATE name=VALUES(name),phone=VALUES(phone),avatar_url=VALUES(avatar_url)');
foreach ($agents as $agent) {
    $agentStatement->execute($agent);
}
$agentIds = $db->query("SELECT id FROM agents WHERE registration_no IN ('R063400Z','R063401Z','R063402Z','R063403Z') ORDER BY FIELD(registration_no,'R063400Z','R063401Z','R063402Z','R063403Z')")->fetchAll(PDO::FETCH_COLUMN);
if (count($agentIds) !== count($agents)) {
    throw new RuntimeException('Expected four portfolio agents.');
}
$propertyPhotos = [
    'https://images.unsplash.com/photo-1600607687939-ce8a6c25118c?auto=format&fit=crop&w=1400&q=85',
    'https://images.unsplash.com/photo-1600566753190-17f0baa2a6c3?auto=format&fit=crop&w=1400&q=85',
    'https://images.unsplash.com/photo-1600210492486-724fe5c67fb0?auto=format&fit=crop&w=1400&q=85',
    'https://images.unsplash.com/photo-1600607687920-4e2a09cf159d?auto=format&fit=crop&w=1400&q=85',
    'https://images.unsplash.com/photo-1600585154340-be6161a56a0c?auto=format&fit=crop&w=1400&q=85',
    'https://images.unsplash.com/photo-1600566753086-00f18fb6b3ea?auto=format&fit=crop&w=1400&q=85',
];
$insert = $db->prepare(<<<'SQL'
INSERT INTO listings
 (external_id,agent_id,slug,title,address,district,property_type,tenure,price,psf,bedrooms,bathrooms,floor_area,location,mrt_name,mrt_distance,image_url,images_json,amenities_json,description,is_featured,status,listed_at)
VALUES
 (:id,:agent,:slug,:title,:address,:district,:type,:tenure,:price,:psf,:beds,:baths,:area,ST_SRID(POINT(:lng,:lat),4326),:station,:distance,:image,:images,'[]','',0,'published',:listed)
ON DUPLICATE KEY UPDATE agent_id=VALUES(agent_id),title=VALUES(title),address=VALUES(address),district=VALUES(district),property_type=VALUES(property_type),
 tenure=VALUES(tenure),price=VALUES(price),psf=VALUES(psf),bedrooms=VALUES(bedrooms),bathrooms=VALUES(bathrooms),floor_area=VALUES(floor_area),
 location=VALUES(location),mrt_name=VALUES(mrt_name),mrt_distance=VALUES(mrt_distance),image_url=VALUES(image_url),images_json=VALUES(images_json),listed_at=VALUES(listed_at),status='published'
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
        $stableHash = hexdec(substr(hash('sha256', (string)$feature['id']), 0, 8));
        $photoIndex = $stableHash % count($propertyPhotos);
        $listingPhotos = [
            $propertyPhotos[$photoIndex],
            $propertyPhotos[($photoIndex + 1) % count($propertyPhotos)],
            $propertyPhotos[($photoIndex + 2) % count($propertyPhotos)],
        ];
        $insert->execute([
            'id' => $feature['id'],
            'agent' => $agentIds[$stableHash % count($agentIds)],
            'slug' => basename($p['listing_url']),
            'title' => $p['name'], 'address' => $p['address'], 'district' => $p['district'],
            'type' => $type, 'tenure' => $tenure ?: null, 'price' => $p['price'], 'psf' => round($p['psf'] ?? 0),
            'beds' => $p['bedrooms'] ?? 0, 'baths' => $p['bathrooms'] ?? 0, 'area' => $p['floor_area'] ?? 0,
            'lng' => $lng, 'lat' => $lat, 'station' => $p['mrt_name'] ?? '',
            'distance' => $p['mrt_distance'], 'image' => $listingPhotos[0],
            'images' => json_encode($listingPhotos, JSON_THROW_ON_ERROR), 'listed' => $p['listed_at'],
        ]);
        $source->execute(['id' => $feature['id'], 'url' => $p['listing_url'], 'subtype' => $p['property_type'] ?? $type]);
    }
    $db->commit();
} catch (Throwable $error) {
    $db->rollBack();
    throw $error;
}
(new HomeScope\Cache())->flushListings();
