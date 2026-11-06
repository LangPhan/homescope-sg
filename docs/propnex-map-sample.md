# PropNex map sample

Use `apps/api/database/propnex-condo-map-sample.geojson` for the sample taken from the [PropNex condo sale results](https://propnex.com/buy/condo). The linked listings identify the development and street, so each marker uses a representative OneMap building inside the development. `map_reference_postal_code` identifies that building and does not identify the advertised unit's block. Transit distances are reported by the results page in metres and were not independently routed from the map pin.

`apps/api/database/propnex-map-sample.geojson` contains three public listing references and the corresponding building points. Each feature links to its PropNex listing and the OneMap lookup used to match its six-digit postal code. The sample represents building locations and does not track listing availability.

GeoJSON uses WGS84 coordinates in longitude, latitude order. For a Google Maps marker, destructure `[lng, lat]` from `feature.geometry.coordinates` and pass `{ lat, lng }` as its position.

MRT fields are null pending verified routing data. The sample includes only location facts and source links. It can be loaded separately from the synthetic catalogue and HDB resale transactions.
