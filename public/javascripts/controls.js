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
          layerGrp.addLayer(controlLayers[layerName]);
          L.DomUtil.addClass(this, 'active');
        }
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