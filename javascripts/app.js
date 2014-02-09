
var map = L.mapbox.map('map', 'lamkeewei.h6p10hml', {
  zoomControl: false,
  doubleClickZoom: false,
}).setView([42.3546, -71.0915], 13);

var setupChart = function(){
  var width = $('#usageChart').width();
  var height = $('#usageChart').height();

  var chart = d3.select('#usageChart').append('svg')
      .attr('width', width)
      .attr('height', height - 40);

   var legend = {
    x_start: width-70,
    x_end: width-100,
    y_first: 15,
    y_second: 40,
    offset_first_y: 8,
    offset_second_y: 7,
    offset_x: 5,
    yt_fudge: 3
  };

  chart.append('g')
        .attr('class', 'line arrivals')
        .append('line')
        .attr('x1', legend.x_start - legend.offset_x)
        .attr('x2', legend.x_end)
        .attr('y1', legend.y_first - legend.offset_first_y)
        .attr('y2', legend.y_first - legend.offset_first_y);

  chart.append('text')
        .text('Bikes in')
        .attr('class', 'legend-title')
        .attr('x', legend.x_start)
        .attr('y', legend.y_first - legend.yt_fudge);
  
  chart.append('g')
        .attr('class', 'line departures')
        .append('line')
        .attr('x1', legend.x_start - legend.offset_x)
        .attr('x2', legend.x_end)
        .attr('y1', legend.y_second - legend.offset_second_y)
        .attr('y2', legend.y_second - legend.offset_second_y);

  chart.append('text')
        .text('Bikes out')
        .attr('class', 'legend-title')
        .attr('x', legend.x_start)
        .attr('y', legend.y_second - legend.yt_fudge);
}

d3.json('stations.geojson', function(err, stations){
  d3.json('censustracts.geojson', function(err, census){
    var stationStyle = L.AwesomeMarkers.icon({
      icon: 'home',
      markerColor: 'cadetblue'
    });

    var stationsLayer = L.geoJson(stations, {
      pointToLayer: function(feature, latLng){
        var name = feature.properties.NAME;
        return L.marker(latLng, {icon: stationStyle});
      }
    });
    var stationMarkers = L.markerClusterGroup({
      // singleMarkerMode: true,
      polygonOptions: {
        color: '#0570b0',
        weight: 2,
        fillColor: '#a6bddb',
        fillOpacity: 0.5
      }
    });

    stationMarkers.addLayer(stationsLayer);

    var censusLayer = L.geoJson(census, {
      style: function(feature){
        var population = feature.properties.population_by_gender_age_10ct_totpop10;

        var color = population > 5672 ? '#045a8d' :
           population > 4193 ? '#2b8cbe' :
           population > 2907 ? '#74a9cf' :
           population > 1210 ? '#bdc9e1' :
                      '#f1eef6';

        return {
          fillColor: color,
          color: 'grey',
          fillOpacity: 0.5,
          weight: 1
        }; 
      }
    });

    map.addControl(new InfoWindow({
      position: 'topright'
    }));

    setupChart();

    var tripsLayer = L.geoJson(stations, {
      pointToLayer: function(feature, latLng){
        var showInfoWindow = function(e){
          var marker = e.target;
          marker.setStyle({
            color: 'black',
            fillOpacity: 1,
          });

          var infoWindow = map.getContainer().querySelector('.infoWindow');

          infoWindow.style.display = 'block';
        }

        var hideInfoWindow = function(e){
          var marker = e.target;
          marker.setStyle({
            fillColor: 'rgb(220,252,192)',
            fillOpacity: 0.8,
            color: 'rgb(106,157,61)'            
          });

          var infoWindow = map.getContainer().querySelector('.infoWindow');
          infoWindow.style.display = 'none';
        }

        return L.circleMarker(latLng, {
          radius: 5,
          fillColor: 'rgb(220,252,192)',
          fillOpacity: 0.8,
          color: 'rgb(106,157,61)'
        }).on({
          // mouseover: showInfoWindow,
          // mouseout: hideInfoWindow
        });
      }
    });

    //Set existing layers here
    var layers = L.layerGroup([censusLayer, tripsLayer]);

    layers.addTo(map);

    //Set overlay layers here
    var overlays = {
      "Stations Locations": stationMarkers,
      "Trips Layer": tripsLayer,
      "Census Layer": censusLayer
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
    });
  });
});