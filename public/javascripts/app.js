var refreshOrder = function(layers, overlays){
  layers.clearLayers();
  var toAdd = [];

  $('.toggle.active').each(function(i, d){
    var key = d.innerHTML;
    toAdd.push(overlays[key]);
  });

  toAdd.reverse().forEach(function(d, i){
    layers.addLayer(d);
  });
}

var hourMap = ["12am",  "1am",  "2am",  "3am",  "4am",  "5am", "6am",
               "7am",  "8am",  "9am",  "10am", "11am",
               "noon",  "1pm",  "2pm",  "3pm", "4pm",  "5pm",  "6pm",
               "7pm",  "8pm",  "9pm",  "10pm",  "11pm",
               "12am",  "1am",  "2am",  "3am",  "4am"];

var map = L.mapbox.map('map', 'lamkeewei.h6p10hml', {
  zoomControl: false,
  doubleClickZoom: false,
  // scrollWheelZoom: false
}).setView([42.3546, -71.0915], 14);



var setupChart = function(){
  var width = $('#usageChart').width();
  var height = $('#usageChart').height();
  var chart = d3.select('#usageChart').append('svg')
      .attr('width', width)
      .attr('height', height);

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
      .range([height - 30, 5]);

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

queue()
.defer(d3.json, 'tracks.geojson')
.defer(d3.json, 'bus_stations.geojson')
.defer(d3.json, 'stations.geojson')
.defer(d3.json, 'censustracts.geojson')
.await(function(err, tracks, bus, stations, census){
  document.querySelector('#loadingOverlay').style.display = 'none';
  var categories = _.map(tracks.features, function(d){
    return d.properties.category;
  });

  categories = _.compact(_.uniq(categories));

  var categoryColors = d3.scale
      .category10()
      .domain(categories);

  var tracksLayer = L.geoJson(tracks, {
    style: function(feature){ 
      return {
        color: categoryColors(feature.properties.category),
        weight: 3,
        opacity: .4
      }
    }
  });

  var stationsLayer = L.geoJson(bus, {
    pointToLayer: function(feature, latLng){
      var color = feature.properties.line;
      color = color.toLowerCase();

      var stationStyle = L.AwesomeMarkers.icon({
        prefix: 'fa',
        icon: 'ticket',
        markerColor: color
      });

      var stationName = feature.properties.station.toLowerCase();
      var fmtName = '';
      stationName.split(' ').forEach(function(word, i){
        fmtName += word.charAt(0).toUpperCase();
        fmtName += word.substring(1) + ' ';
      });

      return L.marker(latLng, {icon: stationStyle}).bindPopup(fmtName.trim(), {
        closeButton: false
      });
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

  var initialData = _.map(census.features, function(d){
    return d.properties['population_by_gender_age_10ct_totpop10'];
  });

  initialData = _.sortBy(initialData, function(d){
    return d;
  });

  var color = d3.scale.quantize().
        domain(initialData).
        range(colorbrewer.GnBu[4]);

  var censusLayer = L.geoJson(census, {
    style: function(feature){
      var population = feature.properties.population_by_gender_age_10ct_totpop10;

      return {
        fillColor: color(population),
        color: 'grey',
        fillOpacity: 0.5,
        weight: 1
      }; 
    }
  });

  var infoWindow = new InfoWindow(map.getCenter());
  map.addLayer(infoWindow);
  // map.addControl(new InfoWindow({
  //   position: 'topright'
  // }));

  var chart = setupChart();
  map.getContainer().querySelector('.infoWindow').style.display = 'none';

  var tripsLayer = L.geoJson(stations, {
    pointToLayer: function(feature, latLng){
      var id = feature.properties.ID;
      var data = _.filter(hourly_data, function(d){
        return d.station_id == id;
      });

      var size = _.reduce(data, function(memo, val){
        var trips = val.arrivals + val.departures;
        return memo + trips;
      }, 0);

      var totalArrivals = _.reduce(data, function(memo, val){
        return memo + val.arrivals;
      }, 0);

      var totalDepartures = _.reduce(data, function(memo, val){
        return memo + val.departures;
      }, 0);

      
      var color;

      if(totalArrivals > totalDepartures) {
        color = '#2c826b';
      } else {
        color = '#df6342';
      }
      
      var showInfoWindow = function(e){
        var marker = e.target;
        var id = marker.feature.properties.ID;
        marker.setStyle({
          color: 'black',
          weight: 4
        });

        var info = map.getContainer().querySelector('.infoWindow');
        var header = map.getContainer().querySelector('.infoWindow h1');
        header.innerHTML = marker.feature.properties.NAME;
        info.style.display = 'block';
        bindDataToChart(chart, id);
      }

      var hideInfoWindow = function(e){
        var marker = e.target;
        marker.setStyle({
          color: color,
          weight: 2
        });

        var infoWindow = map.getContainer().querySelector('.infoWindow');
        infoWindow.style.display = 'none';
      }
      
      var html = $('.infoWindow').html();
      
      return L.circleMarker(latLng, {
        radius: Math.sqrt(size) * 1.7,
        fillColor: color,
        fillOpacity: 0.55,
        weight: 2,
        color: color
      }).on('click', function(e){
        var marker = e.target;
        var id = marker.feature.properties.ID;
        var info = map.getContainer().querySelector('.infoWindow');
        info.style.display = 'block';
        var header = map.getContainer().querySelector('.infoWindow h1');
        header.innerHTML = marker.feature.properties.NAME;
        info.style.display = 'block';
        bindDataToChart(chart, id);

        var html = $('.infoWindow').html();
        marker.bindPopup(html, {
          maxWidth: 250,
          minWidth: 250,
          maxHeight: 360,
          // closeButton: false
        }).on('popupclose', function(){
          var info = map.getContainer().querySelector('.infoWindow');
          info.style.display = 'none';
        }).openPopup();
      });
    }
  });

  //Set existing layers here
  var layers = L.layerGroup([tripsLayer]);

  layers.addTo(map);

  //Set overlay layers here
  var overlays = {
    "Trips Layer": tripsLayer,
    "Bus Stations Locations": stationMarkers,
    "Tracks Layer": tracksLayer,
    "Census Layer": censusLayer
  };

  var toggleControl = new ToggleControl(layers, overlays, {
    position: 'topleft'
  });

  map.addControl(toggleControl);
  
  var legendControl = new LegendControl({
    position: 'bottomright'
  });

  map.addControl(legendControl);
  legendControl.initializeLegends(initialData);

  map.addControl(new ChloroControl({
    position: 'topleft'
  }, censusLayer, layers, census, refreshOrder, overlays, toggleControl, legendControl));

  var sortable = map.getContainer().querySelector('.sortable');
  $(sortable).sortable({
    items: ':not(.disabled)'
  }).bind('sortupdate', function(e, ui){
    refreshOrder(layers, overlays);
  });

  map.addControl(new DetailMap({
    position: 'topright'
  }));

  map.addControl(new NavControls({
    position: 'bottomleft'
  }));

  map.getContainer().querySelector('#censusLegend').style.display = 'none';

  L.control.pan({
    position: 'bottomleft'
  }).addTo(map);

  var minimap = L.mapbox.map('minimap', 'lamkeewei.h6p10hml', {
    zoomControl: false,
    doubleClickZoom: false,
    scrollWheelZoom: false,
    attributionControl: false,
    zoomControl: false,
    boxZoom: false,
    touchZoom: false,
    scrollWheelZoom: false,
    doubleClickZoom: false,
    dragging: false,
    keyboard: false,
    legendControl: false
  }).setView([42.3546, -71.0915], 17);

  var miniStations = L.geoJson(stations, {
    pointToLayer: function(feature, latLng){          
      var stationStyle = L.AwesomeMarkers.icon({
        prefix: 'fa',
        icon: 'home',
        markerColor: 'cadetblue'
      });

      return L.marker(latLng, {icon: stationStyle});
    }
  });
  minimap.addLayer(miniStations);

  L.DomEvent.on(map, 'mousemove', function(e){
    minimap.setView(e.latlng, 17, {
      pan: {animate: false}
    });
  });
});