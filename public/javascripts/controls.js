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
    header.innerHTML = 'LAYER TOGGLE';

    var targetLayer;
    var context = L.DomUtil.create('div', 'contextMenu', map.getContainer());
    var option = L.DomUtil.create('div', '', context);
    option.innerHTML = '<i class="fa fa-search-plus"></i> Zoom to layer';

    L.DomEvent.on(option, 'click', function(e){
      var layer = controlLayers[targetLayer];
      // console.log(layer.getBounds());
      map.fitBounds(layer.getBounds());
    });

    var optionTwo = L.DomUtil.create('div', '', context);
    optionTwo.innerHTML = '<i class="fa fa-cog"></i> Settings';

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
        }else{
          L.DomUtil.addClass(this, 'active');
          var activeLayers = map.getContainer().querySelectorAll('.toggle.active');
          layerGrp.clearLayers();

          for (var i = activeLayers.length - 1; i >= 0; i--) {
            var layerName = activeLayers[i].innerHTML;
            layerGrp.addLayer(controlLayers[layerName]);
          };
        }
      });
      
      L.DomEvent.on(layer, 'contextmenu', function(e){
        e.preventDefault();
        targetLayer = this.innerHTML;
        context.style.display = 'block';
        context.style.top = e.pageY + 'px';
        context.style.left = e.pageX + 'px';

        L.DomEvent.on(map.getContainer(), 'click', function(){
          context.style.display = 'none';
        })
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
    L.Util.setOptions(options);
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