# MarsMind AI — NASA data sources

## 1. NASA Mars Trek (map imagery)

- Docs: https://trek.nasa.gov/tiles/apidoc/trekAPI.html?body=mars
- Imagery delivered as WMTS tiles (PNG/JPEG). Use on the frontend; do not interpret image colors as elevation measurements.
- WMTS coverage/projection vary by layer. Refer to the layer GetCapabilities XML before choosing a tile scheme.

## 2. USGS Mars MGS MOLA 463m DEM (numeric elevations)

- Details: https://astrogeology.usgs.gov/search/map/mars_mgs_mola_dem_463m
- Direct official source file: https://planetarymaps.usgs.gov/mosaic/Mars_MGS_MOLA_DEM_mosaic_global_463m.tif
- Approx. 2 GB global GeoTIFF. Do not auto-download it during API requests or into Git.
- Download once, and extract a small Jezero-region grid using `backend/scripts/prepare_mola.py`.
- The product is coarse (~463 m/pixel); individual boulders and rover-scale obstacles are not resolved.
- The raster data's longitude convention, grid alignment, vertical datum, and north-up status should be confirmed before preparing any different region.

## Integrity / demo honesty

- The supplied `demo-jezero` fixture is SYNTHETIC, not a sample of MOLA or Mars observations.
- The slope-based score is only a simple educational heuristic, not validated mission safety guidance.
- Claims of hazard **detection** should be qualified as slope-derived **risk estimation** for this MVP.
- Live external API calls are not required for local data processing; the source GeoTIFF is downloaded/prepared separately.
