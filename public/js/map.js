function initMap2(nbr,alt,lng,idB) 
{
 
 if (alt ==null ||lng==null) 
{
	alt = [47.218371]; 
	lng = [-1.553621] ;
	nbr = 1;
	idB =["Sites Nantes"];
	
}
var map = new google.maps.Map(document.getElementById('map'), {
					center: new google.maps.LatLng(alt[0], lng[0]),
					zoom: 12,
					title: idB[0]
				  });

			 for(i =0; i< nbr ; i++){
				  console.log("l'Altitude "+alt[i]);
				  console.log("l'Longitude "+lng[i]);
					   var newlatlg = new google.maps.LatLng(alt[i], lng[i]);

						  var optionsMarqueur = {
										  position: newlatlg,
										  map: map,
										  title: idB[i]
										  };
						  var marqueur = new google.maps.Marker(optionsMarqueur);
						 /*  var contentString =	'<strong>'+idB+'</strong>' +
									'<br /><img src="./../images/icone-benne.png" alt="" />' 
						   var infowindow = new google.maps.InfoWindow({
						   content: contentString
									  });
						marqueur.addListener('click', function() {
							infowindow.open(map, marqueur); 
						  });*/
			  }

 

	// création des markers dans une boucle 
  
  var input = /** @type {!HTMLInputElement} */(
  document.getElementById('pac-input'));

  var types = document.getElementById('type-selector');
  map.controls[google.maps.ControlPosition.TOP_LEFT].push(input);
  map.controls[google.maps.ControlPosition.TOP_LEFT].push(types);

  var autocomplete = new google.maps.places.Autocomplete(input);
  autocomplete.bindTo('bounds', map);

  var infowindow = new google.maps.InfoWindow();
  var marker = new google.maps.Marker({
    map: map,
    anchorPoint: new google.maps.Point(0, -29)
  });

  autocomplete.addListener('place_changed', function() 
  {
    infowindow.close();
    marker.setVisible(false);
    var place = autocomplete.getPlace();
    if (!place.geometry) {
      window.alert("Autocomplete's returned place contains no geometry");
      return;
    }

    // If the place has a geometry, then present it on a map.
    if (place.geometry.viewport) 
	{
      map.fitBounds(place.geometry.viewport);
    } else {
      map.setCenter(place.geometry.location);
      map.setZoom(14);  // Why 17? Because it looks good.
    }
    marker.setIcon(/** @type {google.maps.Icon} */({
      url: place.icon,
      size: new google.maps.Size(71, 71),
      origin: new google.maps.Point(0, 0),
      anchor: new google.maps.Point(17, 34),
      scaledSize: new google.maps.Size(35, 35)
    }));
    marker.setPosition(place.geometry.location);
    marker.setVisible(true);

    var address = '';
    if (place.address_components) {
      address = [
        (place.address_components[0] && place.address_components[0].short_name || ''),
        (place.address_components[1] && place.address_components[1].short_name || ''),
        (place.address_components[2] && place.address_components[2].short_name || '')
      ].join(' ');
    }

    infowindow.setContent('<div><strong>' + place.name + '</strong><br>' + address);
    infowindow.open(map, marker);
  });
}