var ToggleControl = L.Control.extend({
  initialize: function(markers, options){
    this.controlLayers = markers;
    L.Util.setOptions(this, options);
  },

  onAdd: function(map){
    var controlLayers = this.controlLayers;

    var container = L.DomUtil.create('div', 'toggleLayer');
    var header = L.DomUtil.create('div', '', container);
    $(header).attr('id', 'header')
    $(header).html('LAYER TOGGLE');

    for(var key in controlLayers){
      var layer = L.DomUtil.create('div', 'toggle', container);
      $(layer).html(key);

      if(map.hasLayer(controlLayers[key])){
        L.DomUtil.addClass(layer, 'active');
      }

      layer.addEventListener('click', function(e){
        if(map.hasLayer(controlLayers[key])){
          map.removeLayer(controlLayers[key]);
          L.DomUtil.removeClass(layer, 'active');
        }else{
          map.addLayer(controlLayers[key]);
          L.DomUtil.addClass(layer, 'active');
        }
      });
    }

    var add = L.DomUtil.create('div', '', container);
    $(add).attr('id', 'add-layer')
    $(add).html('<i class="fa fa-plus"></i>  ADD LAYER');

    return container;
  }
});