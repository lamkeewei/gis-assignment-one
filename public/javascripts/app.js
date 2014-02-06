
d3.json('education.geojson', function(err, data){
  var geojson = L.geoJson(data);
  var markers = L.markerClusterGroup({
    singleMarkerMode: true,
    polygonOptions: {
      color: '#0570b0',
      weight: 2,
      fillColor: '#a6bddb',
      fillOpacity: 0.5
    }
  });
  
  markers.addLayer(geojson);

  var map = L.mapbox.map('map', 'lamkeewei.h6p10hml', {
    zoomControl: false,
    doubleClickZoom: false,
    layers: [markers]
  }).setView([1.3592589261843264, 103.81118774414062], 12);

  map.addControl(new ToggleControl({
    "School Locations": markers
  }, {
    position: 'topleft'
  }));
});


// L.control.zoom({
//   position: 'topright'
// }).addTo(map);