
var hourMap = ["12am",  "1am",  "2am",  "3am",  "4am",  "5am", "6am",
               "7am",  "8am",  "9am",  "10am", "11am",
               "noon",  "1pm",  "2pm",  "3pm", "4pm",  "5pm",  "6pm",
               "7pm",  "8pm",  "9pm",  "10pm",  "11pm",
               "12am",  "1am",  "2am",  "3am",  "4am"];

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

  chart.append('path')
        .attr('class', 'line arrivals');

  chart.append('path')
        .attr('class', 'line departures');

  chart.append("path")
        .attr("class", "area arrivals");
    
  chart.append("path")  
        .attr("class", "area departures");

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

  return chart;
}

var bindDataToChart = function(chart, id){
  var width = $('#usageChart').width();
  var height = $('#usageChart').height();

  var data = _.filter(hourly_data, function(d){
    return d.station_id == id;
  });

  var arrivalMin = d3.min(data, function(d){
    return d.arrivals;
  });

  var arrivalMax = d3.max(data, function(d){
    return d.arrivals;
  });

  var departureMin = d3.min(data, function(d){
    return d.departures;
  });

  var departureMax = d3.max(data, function(d){
    return d.departures;
  });

  var arrivals = _.map(data, function(d){
    return d.arrivals;
  });

  var departures = _.map(data, function(d){
    return d.departures;
  });

  var min = Math.min(arrivalMin, departureMin);
  var max = Math.max(arrivalMax, departureMax);

  var x_scale = d3.scale.ordinal()
      .domain(_.range(0, 30))
      .rangeRoundBands([0, width]);

  var y_scale = d3.scale.linear()
      .domain([min, max * 1.5])
      .range([height - 80, 5]);

  var line = d3.svg.line()
      .x(function(d, i){ 
        return x_scale(i);
      })
      .y(function(d){
        return y_scale(d); 
      })
      .interpolate('cardinal');

  var area = d3.svg.area()
        .interpolate('cardinal') // curve the lines a little bit
        .x(function(d, i) { return x_scale(i); })
        .y1(function(d) { return y_scale(d); })
        .y0(function(d) { return y_scale(0);})

  chart.selectAll('path.line.arrivals')
        .datum(arrivals)
        .attr('d', line);

  chart.selectAll('path.line.departures')
        .datum(departures)
        .attr('d', line);

  chart.selectAll("path.area.departures")
        .datum(departures)
        .attr("d", area);

  chart.selectAll("path.area.arrivals")
        .datum(arrivals)
        .attr("d", area);

  var x_axis = d3.svg.axis()
        .scale(x_scale)
        .orient('bottom')
        .tickSize(6, 3, 0)
        .tickValues([0, 4, 8, 12, 16, 20, 24, 28])
        .tickFormat(function(d){
            return hourMap[(parseInt(d))];
        });
  var y_axis = d3.svg.axis()
        .scale(y_scale)
        .orient("right")
        .ticks(5)
  .tickFormat(function(d){
      return (d == "0"? '': d);
  });

  chart.selectAll('g.axis').remove();

  chart.append('g')
        .attr('class', 'axis')
        .attr('transform', 'translate(0, ' + y_scale(0) + ')' )
        .call(x_axis);

  chart.append("g")
        .attr("class", "y axis")
        .call(y_axis)
        .append("text")
        .attr("transform", "rotate(-90)")
        .attr("y", 30) // Does this make sense?
  .attr("x", -30)
  .attr("dy", ".71em")
        .style("text-anchor", "end")
        .text("Trips per Hour");
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

    var chart = setupChart();
    bindDataToChart(chart, 25);

    var tripsLayer = L.geoJson(stations, {
      pointToLayer: function(feature, latLng){
        var showInfoWindow = function(e){
          var marker = e.target;
          var id = marker.feature.properties.ID;
          marker.setStyle({
            color: 'black',
            fillOpacity: 1,
          });

          var infoWindow = map.getContainer().querySelector('.infoWindow');
          var header = map.getContainer().querySelector('.infoWindow h1');
          header.innerHTML = marker.feature.properties.NAME;
          // infoWindow.style.display = 'block';
          bindDataToChart(chart, id);
        }

        var hideInfoWindow = function(e){
          var marker = e.target;
          marker.setStyle({
            fillColor: 'rgb(220,252,192)',
            fillOpacity: 0.8,
            color: 'rgb(106,157,61)'            
          });

          var infoWindow = map.getContainer().querySelector('.infoWindow');
          // infoWindow.style.display = 'none';
        }

        return L.circleMarker(latLng, {
          radius: 5,
          fillColor: 'rgb(220,252,192)',
          fillOpacity: 0.8,
          color: 'rgb(106,157,61)'
        }).on({
          mouseover: showInfoWindow,
          mouseout: hideInfoWindow
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