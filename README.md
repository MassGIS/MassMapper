# MassMapper

## Adding a new ESRI basemap.

We will use the existing '2019 Aerial Imagery' basemap as a template.

1. Add the Leaflet definition to `./packages/massmapper-app/src/services/MapService.ts`.  It should look something like the following.  The order in this section of code determines the order of layers in the MassMapper basemap TOC.  Make sure that you don't miss the final comma (if necessary).  And set `pdfOK: true` if your new basemap should be PDF-friendly.

Around line 79.
```
{
  name: 'MassGIS Basemap',
  layer: new TileLayer(
    'https://tiles.arcgis.com/tiles/hGdibHYSPO59RG1h/arcgis/rest/services/MassGISBasemap/MapServer/tile/{z}/{y}/{x}',
    {
      maxZoom: 19,
      minZoom: 7,
      attribution: '<a href="https://www.mass.gov/service-details/massgis-base-map">MassGIS</a>'
    }
  ),
  pdfOk: true
},
```

2. Add the new layer to the MassMapper config engine, `./packages/massmapper-app/src/services/ConfigService.ts` in two places.

Around line 42.
```
get availableBasemaps(): string[] {
  return this._config.availableBasemaps || [
    'MassGIS Basemap',
    '2019 Aerial Imagery',
    'USGS Topographic Quadrangle Maps',
    ...
```

Around line 84.
```
geoserverUrl: 'https://giswebservices.massgis.state.ma.us',
folderSet: '',
initialExtent: [-73.508142, 41.237964, -69.928393, 42.886589],
tools: [],
availableBasemaps: [
  'MassGIS Basemap',
  '2019 Aerial Imagery',
  'USGS Topographic Quadrangle Maps',
  ...
```

3. Add the new layer to the main config file, `./htdocs/config/MassMapper.json`.

Around line 105.
```
"availableBasemaps": [
  "MassGIS Basemap",
  "2019 Aerial Imagery",
  "USGS Topographic Quadrangle Maps",
  ...
```

## Handy reference to GitHub's markdown syntax.
https://guides.github.com/features/mastering-markdown/
