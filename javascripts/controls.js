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
        var layerName = this.innerHTML;
        if(layerGrp.hasLayer(controlLayers[layerName])){
          layerGrp.removeLayer(controlLayers[layerName]);
          L.DomUtil.removeClass(this, 'active');
          if(layerName === 'Census Layer'){
            map.getContainer().querySelector('#chloro-control').style.display = 'none';
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
          }
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

    var add = L.DomUtil.create('li', 'disabled', container);
    L.DomEvent.on(add, 'click', function(){
      alert('Select data');
    });

    add.setAttribute('id', 'add-layer');
    add.innerHTML = '<i class="fa fa-plus"></i>  ADD LAYER'; 

    return container;
  }
});

var InfoWindow = L.Control.extend({
  initialize: function(options){
    L.Util.setOptions(this, options);
  },

  onAdd: function(map){
    var container = L.DomUtil.create('div', 'infoWindow');
    var header = L.DomUtil.create('h1', '', container);
    header.innerHTML = 'Usage By Hour';
    header.setAttribute('id', 'info-title');

    var chart = L.DomUtil.create('div', '', container);
    chart.setAttribute('id', 'usageChart');
    return container;
  }
});

var ChloroControl = L.Control.extend({
  initialize: function(options, layer, layerGrp, data, refreshOrder, overlays, toggleControl){
    this.layer = layer;
    this.layerGrp = layerGrp;
    this.data = data;
    this.overlays = overlays;
    this.refreshOrder = refreshOrder;
    this.toggleControl = toggleControl;
    L.Util.setOptions(this, options);
  },

  onAdd: function(map){
    var layer = this.layer;
    var layerGrp = this.layerGrp;
    var data = this.data;
    var refreshOrder = this.refreshOrder;
    var overlays = this.overlays;
    var toggleControl = this.toggleControl;

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
      if(count > 14){
        var opt = L.DomUtil.create('option', '', select);
        opt.innerHTML = v;
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

      var color = d3.scale.quantize()
                      .domain(targetData)
                      .range(colorbrewer[colorPicker.value][classPicker.value]);

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