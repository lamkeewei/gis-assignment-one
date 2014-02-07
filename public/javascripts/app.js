
d3.json('education.geojson', function(err, education){
  d3.json('census.geojson', function(err, census){
    var educationLayer = L.geoJson(education);
    var markers = L.markerClusterGroup({
      singleMarkerMode: true,
      polygonOptions: {
        color: '#0570b0',
        weight: 2,
        fillColor: '#a6bddb',
        fillOpacity: 0.5
      }
    });

    markers.addLayer(educationLayer);
    var censusLayer = L.geoJson(census, {
      style: {
        fillColor: '#a6bddb',
        fillOpacity: 0.5,
        weight: 2
      }, 
      onEachFeature: function(feature, layer){
        var hightlight = function(e){
          var layer = e.target;
          layer.setStyle({
            fillColor: 'grey'
          });
        };

        var unhighlight = function(e){
          var layer = e.target;
          layer.setStyle({
            fillColor: '#a6bddb'
          });
        }
                   
        layer.on({
          mouseover: hightlight,
          mouseout: unhighlight
        });
      }
    });

    var censusLayerTwo = L.geoJson(census, {
      style: {
        fillColor: 'black',
        fillOpacity: 1,
        weight: 2
      }, 
      onEachFeature: function(feature, layer){
        var hightlight = function(e){
          var layer = e.target;
          layer.setStyle({
            fillColor: 'grey'
          });
        };

        var unhighlight = function(e){
          var layer = e.target;
          layer.setStyle({
            fillColor: '#a6bddb'
          });
        }
                   
        layer.on({
          mouseover: hightlight,
          mouseout: unhighlight
        });
      }
    });

    var layers = L.layerGroup([censusLayer, markers]);

    var map = L.mapbox.map('map', 'lamkeewei.h6p10hml', {
      zoomControl: false,
      doubleClickZoom: false,
    }).setView([1.3592589261843264, 103.81118774414062], 12);

    layers.addTo(map);
    var overlays = {
      "School Locations": markers,
      "Census Layer": censusLayer,
      "Location": censusLayerTwo
    };

    map.addControl(new ToggleControl(layers, overlays, {
      position: 'topleft'
    }));

    var sortable = map.getContainer().querySelector('.sortable');
    $(sortable).sortable({
      items: ':not(.disabled)'
    }).bind('sortupdate', function(e, ui){
      layers.clearLayers();
      var toAdd = [];

      $('.toggle.active').each(function(i, d){
        var key = d.innerHTML;
        toAdd.push(overlays[key]);
      });

      toAdd.reverse().forEach(function(d, i){
        layers.addLayer(d);
      });

      console.log(layers);
    });
  });
});


// L.control.zoom({
//   position: 'topright'
// }).addTo(map);