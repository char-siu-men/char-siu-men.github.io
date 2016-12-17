//= require_self
$(function() {
	'use strict';

  function initialize() {
    var latlng = new google.maps.LatLng(35.688718, 139.709294);
    var mapOptions ={
      zoom: 18,
      mapTypeId: google.maps.MapTypeId.ROADMAP,
      center: new google.maps.LatLng(35.688718, 139.709294),
  		scrollwheel: false,
      draggable: false,
      mapTypeControl: false,
      disableDoubleClickZoom: true,
      noClear: true,
    };
    var map = new google.maps.Map(document.getElementById('gmap'), mapOptions);
    var marker = new google.maps.Marker({
      position: latlng,
      map: map
    });
  }
  if ($('#gmap').length > 0) {
    initialize();
  }
});
