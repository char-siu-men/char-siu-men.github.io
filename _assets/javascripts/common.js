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
  new Layzr()
    .on('src:before', function(element) {
      if ($(element).hasClass('loader_m')) {
        var width = $(element).width();
        $(element).parent().css({
          'background-image': $(element).data('loading'),
          'background-position': 'center center',
          'background-repeat': 'no-repeat',
          'background-color': '#000',
          'min-height': parseInt(width*0.5) + 'px'
        });
      }
    })
    .on('src:after', function(element) {
      if ($(element).hasClass('loader_m')) {
        $(element).parent().css({
          'background-image': '',
          'background-color': '',
          'min-height': ''
        });
      }
    })
    .update()
    .check()
    ;
  if ($('#gmap').length > 0) {
    initialize();
  }
});
