var ToggleControl = L.Control.extend({
  initialize: function(layers, overlays, options){
    this.layerGrp = layers;
    this.controlLayers = overlays;
    L.Util.setOptions(this, options);
  },

  onAdd: function(map){
    var controlLayers = this.controlLayers;

    var container = L.DomUtil.create('ul', 'toggleLayer sortable');
    var header = L.DomUtil.create('li', 'disabled', container);
    header.setAttribute('id', 'header');
    header.innerHTML = 'LAYER CONTROLS';

    var targetLayer;
    var context = L.DomUtil.create('div', 'contextMenu', map.getContainer());
    var option = L.DomUtil.create('div', '', context);
    option.innerHTML = '<i class="fa fa-search-plus"></i> Zoom to layer';

    map.on('click', function(e){
      context.style.display = 'none';
    })

    L.DomEvent.on(option, 'click', function(e){
      var layer = controlLayers[targetLayer];
      map.fitBounds(layer.getBounds());
      context.style.display = 'none';
    });

    var cancel = L.DomUtil.create('div', '', context);
    cancel.innerHTML = 'Cancel';

    L.DomEvent.on(cancel, 'click', function(e){
      context.style.display = 'none';
    });

    for(var key in controlLayers){
      var layer = L.DomUtil.create('li', 'toggle', container);
      var layerGrp = this.layerGrp;

      layer.innerHTML = key;

      if(layerGrp.hasLayer(controlLayers[key])){
        L.DomUtil.addClass(layer, 'active');
      }

      L.DomEvent.disableClickPropagation(layer);
      
      L.DomEvent.on(layer, 'click', function(e){
        context.style.display = 'none';
        var layerName = this.innerHTML;
        if(layerGrp.hasLayer(controlLayers[layerName])){
          layerGrp.removeLayer(controlLayers[layerName]);
          L.DomUtil.removeClass(this, 'active');
          if(layerName === 'Census Layer'){
            map.getContainer().querySelector('#chloro-control').style.display = 'none';
            map.getContainer().querySelector('#censusLegend').style.display = 'none';
          }

          if(layerName === 'Trips Layer'){
            map.getContainer().querySelector('#tripsLegend').style.display = 'none';
          }
        }else{
          L.DomUtil.addClass(this, 'active');
          var activeLayers = map.getContainer().querySelectorAll('.toggle.active');
          layerGrp.clearLayers();

          for (var i = activeLayers.length - 1; i >= 0; i--) {
            var layerName = activeLayers[i].innerHTML;
            layerGrp.addLayer(controlLayers[layerName]);
          };
          
          if(this.innerHTML === 'Census Layer'){
            map.getContainer().querySelector('#chloro-control').style.display = 'block';
            map.getContainer().querySelector('#censusLegend').style.display = 'block';
          }

          if(layerName === 'Trips Layer'){
            map.getContainer().querySelector('#tripsLegend').style.display = 'block';
          }
        }

        var active = $('.toggle.active');

        var tripsOrCensus = false;

        $('.toggle.active').each(function(i, d){
          var key = d.innerHTML;
          if(key === 'Trips Layer' || key === 'Census Layer'){
            tripsOrCensus = true;
          }
        });

        if(active.length > 0 && tripsOrCensus){
          map.getContainer().querySelector('#legendControl').style.display = 'block';
        } else {
          map.getContainer().querySelector('#legendControl').style.display = 'none';
        }
      });

      L.DomEvent.on(layer, 'contextmenu', function(e){
        e.preventDefault();

        targetLayer = this.innerHTML;
        context.style.display = 'block';
        context.style.top = e.pageY + 'px';
        context.style.left = e.pageX + 'px';
      });
    }

    // var add = L.DomUtil.create('li', 'disabled', container);
    // L.DomEvent.on(add, 'click', function(){
    //   alert('Select data');
    // });

    // add.setAttribute('id', 'add-layer');
    // add.innerHTML = '<i class="fa fa-plus"></i>  ADD LAYER'; 

    return container;
  }
});

var InfoWindow = L.Class.extend({
  initialize: function(latlng){
    this._latlng = latlng;
  },

  setPos: function(latlng){
    var pos = this._map.latLngToLayerPoint(latlng);
    L.DomUtil.setPosition(this._container, pos);
  },

  onAdd: function(map){
    this._map = map;

    this._container = L.DomUtil.create('div', 'infoWindow leaflet-zoom-hide');
    var header = L.DomUtil.create('h1', '', this._container);
    header.innerHTML = 'Usage By Hour';
    header.setAttribute('id', 'info-title');

    var chart = L.DomUtil.create('div', 'leaflet-zoom-hide', this._container);
    chart.setAttribute('id', 'usageChart');
    
    map.getPanes().mapPane.appendChild(this._container);
  }
});

var ChloroControl = L.Control.extend({
  initialize: function(options, layer, layerGrp, data, refreshOrder, overlays, toggleControl, legendControl){
    this.layer = layer;
    this.layerGrp = layerGrp;
    this.data = data;
    this.overlays = overlays;
    this.refreshOrder = refreshOrder;
    this.toggleControl = toggleControl;
    this.legendControl = legendControl;

    L.Util.setOptions(this, options);
  },

  onAdd: function(map){
    var layer = this.layer;
    var layerGrp = this.layerGrp;
    var data = this.data;
    var refreshOrder = this.refreshOrder;
    var overlays = this.overlays;
    var toggleControl = this.toggleControl;
    var legendControl = this.legendControl;

    var variables = this.data.features[0].properties;
    var container = L.DomUtil.create('div', 'chloroControl');
    container.setAttribute('id', 'chloro-control');
    var header = L.DomUtil.create('div', '', container);
    header.innerHTML = 'Census Layer Control'.toUpperCase();
    header.setAttribute('id', 'header');

    L.DomEvent.disableClickPropagation(container);

    var selectorContainer = L.DomUtil.create('div', '', container);
    var label = L.DomUtil.create('label', 'control-label', selectorContainer);
    label.innerHTML = 'Select variable: ';
    var select = L.DomUtil.create('select', 'form-control', selectorContainer);

    //Hack job!!!
    var count = 0;
    for(var v in variables){
      if(count > 15){
        var opt = L.DomUtil.create('option', '', select);
        opt.innerHTML = labels[count - 16];
        opt.value = v;

        if(v === "population_by_gender_age_10ct_totpop10"){
          opt.selected = true;
        }
      }
      count++;
    }

    var label = L.DomUtil.create('label', 'control-label', selectorContainer);
    label.innerHTML = 'Color scale: ';
    var colorPicker = L.DomUtil.create('select', 'form-control', selectorContainer);

    for(var colorScheme in colorbrewer){
      var opt = L.DomUtil.create('option', '', colorPicker);
      opt.innerHTML = colorScheme;
      opt.value = colorScheme;

      if(colorScheme === 'GnBu'){
        opt.selected = true;
      }
    }

    var label = L.DomUtil.create('label', 'control-label', selectorContainer);
    label.innerHTML = 'No. of Classes: ';
    var classPicker = L.DomUtil.create('select', 'form-control', selectorContainer);
    for(var i = 3; i <= 9; i++){
      var opt = L.DomUtil.create('option', '', classPicker);
      opt.innerHTML = i;
      opt.value = i;
      if(i == 4){
        opt.selected = true;
      }
    }

    L.DomEvent.on(select, 'change', function(e){
      var targetVal = e.target.value;
      var targetData = _.map(data.features, function(d){
        return d.properties[targetVal];
      });

      targetData = _.sortBy(targetData, function(d){
        return d;
      });

      var colorScheme = colorbrewer[colorPicker.value][classPicker.value];

      legendControl.updateCensusLegend(colorScheme, targetData);

      var color = d3.scale.quantize()
                      .domain(targetData)
                      .range(colorScheme);

      if(layerGrp.hasLayer(layer)){
        layer.setStyle(function(feature){
          var population = feature.properties[targetVal];

            return {
              fillColor: color(population),
              color: 'grey',
              fillOpacity: 0.5,
              weight: 1
            };
        });
      }
    });

    L.DomEvent.on(colorPicker, 'change', function(e){
      var type = e.target.value;
      var colorScheme = colorbrewer[type][classPicker.value];
      var targetVal = select.value;

      var targetData = _.map(data.features, function(d){
        return d.properties[targetVal];
      });

      targetData = _.sortBy(targetData, function(d){
        return d;
      });

      legendControl.updateCensusLegend(colorScheme, targetData);

      var color = d3.scale.quantize()
                      .domain(targetData)
                      .range(colorScheme);

      layer.setStyle(function(feature){
        var population = feature.properties[targetVal];

      return {
          fillColor: color(population),
          color: 'grey',
          fillOpacity: 0.5,
          weight: 1
        }; 
      }); 
    });

    L.DomEvent.on(classPicker, 'change', function(e){
      var classNum = e.target.value;
      var colorScheme = colorbrewer[colorPicker.value][classNum];
      var targetVal = select.value;

      var targetData = _.map(data.features, function(d){
        return d.properties[targetVal];
      });

      targetData = _.sortBy(targetData, function(d){
        return d;
      });

      legendControl.updateCensusLegend(colorScheme, targetData);
      
      var color = d3.scale.quantize()
                      .domain(targetData)
                      .range(colorScheme);

      layer.setStyle(function(feature){
        var population = feature.properties[targetVal];

        return {
          fillColor: color(population),
          color: 'grey',
          fillOpacity: 0.5,
          weight: 1
        }; 
      });
    });

    container.style.display = 'none';
    return container;
  }
});

var DetailMap = L.Control.extend({
  intialize: function(options){
    L.Util.setOptions(this, options);
  },

  onAdd: function(map){
    var container = L.DomUtil.create('div', '');
    container.setAttribute('id', 'detailMap');

    var mapArea = L.DomUtil.create('div', '', container);
    mapArea.setAttribute('id', 'minimap');

    return container;
  }
});

var NavControls = L.Control.extend({
  initialize: function(options){
    L.Util.setOptions(this, options);
  },

  onAdd: function(map){
    var container = L.DomUtil.create('div');
    var zoomControls = L.DomUtil.create('div', '', container);
    zoomControls.setAttribute('id', 'zoomControls');

    var zoomIn = L.DomUtil.create('div', 'zoomIn', zoomControls);
    zoomIn.innerHTML = '+';
    L.DomEvent.on(zoomIn, 'click', function(e){
      map.zoomIn();
    });

    var zoomOut = L.DomUtil.create('div', 'zoomOut', zoomControls);
    zoomOut.innerHTML = '-';
    L.DomEvent.on(zoomOut, 'click', function(e){
      map.zoomOut();
    });

    var latLngViewer = L.DomUtil.create('div', '', container);
    latLngViewer.setAttribute('id', 'latLngViewer');
    var center = map.getCenter();
    latLngViewer.innerHTML = 'Position: (' + center.lat + ', ' + center.lng + ')';

    map.on('mousemove', function(e){
      var center = e.latlng;
      var container = map.getContainer().querySelector('#latLngViewer');
      var lat = parseFloat(center.lat);

      var lng = parseFloat(center.lng);
      container.innerHTML = 'Position: (' + lat.toFixed(4) + ', ' + lng.toFixed(4) + ')';
    });

    return container;
  }
});

var LegendControl = L.Control.extend({
  initialize: function(options){
    L.Util.setOptions(this, options);
  },

  onAdd: function(map){
    var container = L.DomUtil.create('div', '');
    container.setAttribute('id', 'legendControl');

    var header = L.DomUtil.create('div', 'header', container);
    header.innerHTML = 'Legend';

    var tripsLegend = L.DomUtil.create('div', '', container);
    tripsLegend.setAttribute('id', 'tripsLegend');
    this.tripsLegend = tripsLegend;

    var busLegend = L.DomUtil.create('div', '', container);
    busLegend.setAttribute('id', 'busLegend');
    this.busLegend = busLegend;

    var tracksLegend = L.DomUtil.create('div', '', container);
    tracksLegend.setAttribute('id', 'tracksLegend');
    this.tracksLegend = tracksLegend;

    var censusLegend = L.DomUtil.create('div', '', container);
    censusLegend.setAttribute('id', 'censusLegend');
    this.censusLegend = censusLegend;
    return container;
  },

  initializeLegends: function(censusData){
    var r = 15;

    var tripsLegend = d3.select('#tripsLegend')
          .append('svg')
          .attr('height', r * 2 + 6);
    
    tripsLegend.append('circle')
          .attr('r', r)
          .attr('cx', r + 3)
          .attr('cy', r + 3)
          .attr('class', 'bikeInLegend');

    tripsLegend.append('text')
          .text('More Bikes In')
          .attr('x', r * 2 + 10)
          .attr('y', r + 8);

    tripsLegend.append('circle')
          .attr('r', r)
          .attr('cx', 150)
          .attr('cy', r + 3)
          .attr('class', 'bikeOutLegend');

    tripsLegend.append('text')
          .text('More Bikes Out')
          .attr('x', 158 + r)
          .attr('y', r + 8);

    var censusLegend = d3.select('#censusLegend')
          .append('svg')
          .attr('height', 30);

    var colorScale = colorbrewer.GnBu[4];
    var fullWidth = $('#censusLegend').width();
    var width = fullWidth / colorScale.length;
    censusLegend.selectAll('rect')
          .data(colorScale)
          .enter()
          .append('rect')
          .attr('width', width)
          .attr('height', 10)
          .attr('x', function(d, i){
            return i * width;
          })
          .style('fill', function(d){
            return d;
          });

    censusLegend.append('text')
          .text(d3.min(censusData))
          .attr('y', 25)
          .attr('id', 'legendMinLabel');

    var maxLabel = censusLegend.append('text')
          .text(d3.max(censusData))
          .attr('y', 25)
          .attr('id', 'legendMaxLabel');

    //Revisit to fix
    maxLabel.attr('x', fullWidth - 30);
  },

  updateCensusLegend: function(colorScale, censusData){
    var legend = d3.select('#censusLegend').select('svg');

    var fullWidth = $('#censusLegend').width();
    var width = fullWidth / colorScale.length;

    var scale = legend.selectAll('rect')
          .data(colorScale);

    scale.style('fill', function(d){
      return d;
    })
    .attr('width', width)
    .attr('x', function(d, i){
      return i * width;
    });

    scale.enter()
      .append('rect')
      .attr('width', width)
      .attr('height', 10)
      .attr('x', function(d, i){
        return i * width;
      })
      .style('fill', function(d){
        return d;
      });

    scale.exit().remove();

    d3.select('#legendMinLabel').text(d3.min(censusData));
    d3.select('#legendMaxLabel').text(d3.max(censusData));
  }
});