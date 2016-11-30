var map, districtSearch = [];

$(window).resize(function() {
  sizeLayerControl();
});

/*$(document).on("click", ".feature-row", function(e) {
  $(document).off("mouseout", ".feature-row", clearHighlight);
  sidebarClick(parseInt($(this).attr("id"), 10));
});*/

$(document).on("mouseout", ".feature-row", clearHighlight);

$("#about-btn").click(function() {
  $("#aboutModal").modal("show");
  $(".navbar-collapse.in").collapse("hide");
  return false;
});

$("#full-extent-btn").click(function() {
  map.fitBounds(districts.getBounds());
  console.log("zoom is " + map.getZoom());
  $(".navbar-collapse.in").collapse("hide");
  return false;
});

$("#nav-btn").click(function() {
  $(".navbar-collapse").collapse("toggle");
  return false;
});

function sizeLayerControl() {
  $(".leaflet-control-layers").css("max-height", $("#map").height() - 60);
}

function clearHighlight() {
  highlight.clearLayers();
}

function highlightFeature(e) {
  var layer = e.target;

  layer.setStyle({
    weight: 5,
    color: '#666',
    dashArray: '',
    fillOpacity: 0.7
  });


  if (!L.Browser.ie && !L.Browser.opera && !L.Browser.edge) {
    layer.bringToFront();
  }
  info.update(layer.feature.properties);
}

function resetHighlight(e) {
  districts.resetStyle(e.target);
  info.update();
}

/* Basemap Layers */
var cartoLight = L.tileLayer("https://cartodb-basemaps-{s}.global.ssl.fastly.net/light_all/{z}/{x}/{y}.png", {
  maxZoom: 19,
  attribution: '&copy; <a href="http://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors, &copy; <a href="https://cartodb.com/attributions">CartoDB</a>'
});

var imageBase = L.tileLayer('http://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}', {
        maxZoom: 18,
        attribution: '&copy; <a href="http://www.esri.com/">Esri</a>'
    });


function getFillColor(d) {
  var red    = ['#fee5d9','#fcbba1','#fc9272','#fb6a4a','#de2d26','#a50f15'],
      purple = ['#f2f0f7','#dadaeb','#bcbddc','#9e9ac8','#756bb1','#54278f'],
      gray   = '#DEDCDC';

  return d === null   ? gray    :
      d < -0.9984  ? purple[4] :
      d < -0.992   ? purple[3] :
      d < -0.96    ? purple[2] :
      d < -0.8     ? purple[1] :
      d < -0.2     ? purple[0] :
      d <  0       ? 'white' :
      d === 0      ? 'white' :
      d <  0.2     ? 'white' :
      d <  0.8     ? red[0]  :
      d <  0.96    ? red[1]  :
      d <  0.992   ? red[2]  :
      d <  0.9984  ? red[3]  :
      d <= 1       ? red[4]  :
      gray;
};

function zoomToFeature(e) {
  map.fitBounds(e.target.getBounds());
}

function style(feature) {
  return {
    weight: 1,
    opacity: 1,
    color: '#b3b3b3',
    fillOpacity: 0.6,
    fillColor: getFillColor(feature.properties.OSSFischerBlack)
  };
};

function onEachFeature(feature, layer) {
  layer.on({
    mouseover: highlightFeature,
    mouseout: resetHighlight,
    click: zoomToFeature
  });
}

var districts = L.geoJson(null, {
  style: style,
  onEachFeature:onEachFeature
});
$.getJSON("data/district_data.json", function (data) {
  districts.addData(data);
});

map = L.map("map", {
  zoom: 7,
  center: [31.50, -98.41],
  layers: [cartoLight, districts],
  zoomControl: false,
  attributionControl: false
});

var info = L.control();

info.onAdd = function (map) {
  this._div = L.DomUtil.create('div', 'info'); // create a div with a class "info"
  this.update();
  return this._div;
};

// method that we will use to update the control based on feature properties passed
info.update = function (props) {
  this._div.innerHTML = '<h4>US Population Density</h4>' +  (props ?
          props.DISTNAME : 'Hover over a district');
};

info.addTo(map);


var legend = L.control({position: 'bottomleft'});

legend.onAdd = function (map) {

  var div = L.DomUtil.create('div', 'info legend'),
      grades = [0, 10, 20, 50, 100, 200, 500, 1000],
      labels = [];

  // loop through our density intervals and generate a label with a colored square for each interval
  for (var i = 0; i < grades.length; i++) {
    div.innerHTML +=
        '<i style="background:' + getFillColor(grades[i] + 1) + '"></i> ' +
        grades[i] + (grades[i + 1] ? '&ndash;' + grades[i + 1] + '<br>' : '+');
  }

  return div;
};

legend.addTo(map);

/* Attribution control */
function updateAttribution(e) {
  $.each(map._layers, function(index, layer) {
    if (layer.getAttribution) {
      $("#attribution").html((layer.getAttribution()));
    }
  });
}
map.on("layeradd", updateAttribution);
map.on("layerremove", updateAttribution);

var attributionControl = L.control({
  position: "bottomright"
});
attributionControl.onAdd = function (map) {
  var div = L.DomUtil.create("div", "leaflet-control-attribution");
  div.innerHTML = "<span class='hidden-xs'>Developed by <a href='http://bryanmcbride.com'>bryanmcbride.com</a> | </span><a href='#' onclick='$(\"#attributionModal\").modal(\"show\"); return false;'>Attribution</a>";
  return div;
};
map.addControl(attributionControl);

var zoomControl = L.control.zoom({
  position: "topleft"
}).addTo(map);



/* Larger screens get expanded layer control and visible sidebar */
if (document.body.clientWidth <= 767) {
  var isCollapsed = true;
} else {
  var isCollapsed = false;
}

var baseLayers = {
  "Street Map": cartoLight,
  "Aerial Imagery": imageBase
};

var groupedOverlays = {
  "Reference": {
    "African American Students": districts
  }
};

var layerControl = L.control.groupedLayers(baseLayers, groupedOverlays, {
  position:'bottomright',
  collapsed: isCollapsed
}).addTo(map);

/* Highlight search box text on click */
$("#searchbox").click(function () {
  $(this).select();
});

/* Prevent hitting enter from refreshing the page */
$("#searchbox").keypress(function (e) {
  if (e.which == 13) {
    e.preventDefault();
  }
});

$("#featureModal").on("hidden.bs.modal", function (e) {
  $(document).on("mouseout", ".feature-row", clearHighlight);
});

/* Typeahead search functionality */
$(document).one("ajaxStop", function () {
  $("#loading").hide();
  sizeLayerControl();
});

// Leaflet patch to make layer control scrollable on touch browsers
var container = $(".leaflet-control-layers")[0];
if (!L.Browser.touch) {
  L.DomEvent
  .disableClickPropagation(container)
  .disableScrollPropagation(container);
} else {
  L.DomEvent.disableClickPropagation(container);
}