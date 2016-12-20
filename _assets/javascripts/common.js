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
  // イメージの遅延ロード
  $('.loader_m').each(function() {
    var $element = $(this);
    var $figure = $element.parent();
    var width = $element.width();
    $figure.css({
      'background-image': 'url(' + $element.data('loading') + ')',
      'background-position': 'center center',
      'background-repeat': 'no-repeat',
      'background-color': '#000',
      'min-height': parseInt(width*0.5) + 'px'
    });
    var $img = $('<img src="' + $element.data('normal') + '"/>');
    $img.hide();
    $img.bind('load', function() {
      $figure.append($img);
      $element.remove();
      $img.show();
      $figure.css({
        'background-image': '',
        'background-color': '',
        'min-height': ''
      });
    });
  });
  // 地図の表示
  if ($('#gmap').length > 0) {
    initialize();
  }
});
