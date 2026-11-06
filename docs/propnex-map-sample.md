# PropNex map sample

`apps/api/database/propnex-map-sample.geojson` contains three public listing references and the corresponding building points. Each feature links to its PropNex listing and the OneMap lookup used to match its six-digit postal code. The sample represents building locations and does not track listing availability.

GeoJSON uses WGS84 coordinates in longitude, latitude order. For a Google Maps marker, destructure `[lng, lat]` from `feature.geometry.coordinates` and pass `{ lat, lng }` as its position.

MRT fields are null pending verified routing data. The sample includes only location facts and source links. It can be loaded separately from the synthetic catalogue and HDB resale transactions.
