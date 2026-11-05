# Performance acceptance notes

Measure against a production build with the seeded 300-listing dataset. Record hardware, cold/warm state, sample size and the exact commit SHA beside results; do not present targets as measured results.

| Signal | Target | Method |
| --- | ---: | --- |
| Warm search API p95 | < 300 ms | 100 requests, representative viewport and filters |
| Cached search p95 | < 100 ms | Same query after cache priming |
| Mobile Lighthouse Performance | ≥ 90 | `/`, `/search`, one detail page |
| Lighthouse Accessibility / SEO | ≥ 95 | Same routes |
| LCP / CLS | < 2.5 s / < 0.1 | Production, warm application |

Before tuning, capture `EXPLAIN ANALYZE` from `apps/api/database/explain.sql`. Confirm the spatial index reduces candidate rows and the common index avoids filesort where possible. Compare response bytes, query duration and cache hit/miss rather than reporting a single aggregate score.
