# MarsMind AI — API contract (Developer 2)

All longitude values are **east-positive** in the range -180..180. Latitude is degrees north. Grid cells are north-to-south (`row=0` is northernmost), west-to-east (`col=0` is westernmost).

Local backend: `http://localhost:8000`; docs: `/docs`.

| Method | Endpoint | Result |
|---|---|---|
| GET | `/health` | health JSON |
| GET | `/api/mars/regions` | available region metadata |
| GET | `/api/mars/regions/{region_id}` | region metadata |
| GET | `/api/terrain/grid?region_id=demo-jezero&stride=4` | rows of terrain cells |
| GET | `/api/terrain/cell?region_id=demo-jezero&row=10&col=12` | one terrain cell |
| GET | `/api/terrain/point?region_id=demo-jezero&lat=18.4&lon=77.35` | nearest containing terrain cell |

Sample terrain cell:

```json
{
  "row": 10,
  "col": 12,
  "lat": 18.42375,
  "lon": 77.33125,
  "elevation_m": -1997.5,
  "slope_deg": 3.2,
  "risk_score": 16,
  "hazard": "low",
  "traversable": true
}
```

**Example values only.** Actual API output will differ.

For Developer 3: `GET /api/terrain/grid` returns `rows` containing `risk_score`, `hazard`, and `traversable`; keep the original `row/col` coordinates when building A* and rescue routing. For full-resolution pathfinding, use `stride=1`. Note that for larger regions, the API limits JSON responses to 10,000 cells; use smaller regional grids or build a server-internal shared service.

For Developer 1: render map overlays from `lat`, `lon`; use `bounds` to align with Mars imagery tiles. Do not assume standard Earth basemap tiles are Mars images. The map and terrain datasets must use compatible longitude conventions.

Source type `synthetic_demo` is test data. Source type `nasa_mola_dem` denotes a locally prepared MOLA subset. Always display the source in the UI.
