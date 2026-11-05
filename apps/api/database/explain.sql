EXPLAIN ANALYZE
SELECT id, slug, price, location
FROM listings
WHERE MBRContains(
  ST_GeomFromText('POLYGON((103.70 1.25,103.95 1.25,103.95 1.45,103.70 1.45,103.70 1.25))', 4326),
  location
)
AND status = 'published'
AND property_type = 'Condo'
AND price BETWEEN 800000 AND 3000000
AND bedrooms >= 2
ORDER BY listed_at DESC, id DESC
LIMIT 21;
