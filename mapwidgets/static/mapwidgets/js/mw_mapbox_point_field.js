class DjangoMapboxPointFieldWidget extends DjangoMapWidgetBase {
  constructor(options) {
    super(options)

    // For the geocoding etc.
    mapboxgl.accessToken = this.mapOptions.access_token;

    this.mapboxSDK = new mapboxSdk({ accessToken: this.mapOptions.access_token });

    this.geocoder = new MapboxGeocoder({
      accessToken: mapboxgl.accessToken,
      zoom: 13,
      placeholder: 'Search a location',
      mapboxgl: mapboxgl,
      reverseGeocode: true,
      marker: false
    })

    this.geocoder.on('result', (place) => this.handleAutoCompletePlaceChange(place.result))

    this.initializeMap();
  }

  initializeMap() {
    var mapCenter = this.mapCenterLocation;
    this.map = new mapboxgl.Map({
      container: this.mapElement.id, // container ID
      style: 'mapbox://styles/mapbox/streets-v11', // style URL
      center: [mapCenter[1], mapCenter[0]], // starting position [lng, lat]
      zoom: this.zoom // starting zoom
    });

    this.geocoder.addTo(this.map)

    this.geolocator = new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true
      },
      showUserLocation: false,
      trackUserLocation: false,
      showUserHeading: false
    })
    this.geolocator.on('geolocate', postion => console.log(position, "this.updateLocationInput"))
    this.map.addControl(this.geolocator)

    this.mapElement.dataset.mapbox_map = this.map
    this.mapElement.dataset.mapbox_map_widget = this

    if (Object.getOwnPropertyNames(this.locationFieldValue).length === 0) {
      this.updateLocationInput(this.locationFieldValue.lat, this.locationFieldValue.lng);
      this.fitBoundMarker();
    }
  }

  addMarkerToMap(lat, lng) {
    this.removeMarker();
    this.marker = new mapboxgl.Marker()
      .setLngLat([parseFloat(lng), parseFloat(lat)])
      .setDraggable(true)
      .addTo(this.map);
    this.marker.on("dragend", this.dragMarker);
  }

  fitBoundMarker() {
    if (this.marker) {
      this.map.flyTo({
        center: this.marker.getLngLat(),
        zoom: 14
      });
    }
  }

  removeMarker(e) {
    if (this.marker) {
      this.marker.remove()
    }
  }

  dragMarker(e) {
    const position = this.marker.getLngLat()
    this.updateLocationInput(position.lat, position.lng)
  }

  handleAddMarkerBtnClick(e) {
    this.mapElement.classList.toggle("click");
    this.addMarkerBtn.toggleClass("active");
    if (this.addMarkerBtn.classList.contains("active")) {
      this.map.on("click", this.handleMapClick);
    } else {
      this.map.off("click", this.handleMapClick);
    }
  }

  handleMapClick(e) {
    this.map.off("click", this.handleMapClick);
    this.mapElement.classList.remove("click");
    this.addMarkerBtn.classList.remove("active");
    this.updateLocationInput(e.lngLat.lat, e.lngLat.lng)
  }

  callPlaceTriggerHandler(lat, lng, place) {
    if (place === undefined) {
      this.mapboxSDK.geocoding.reverseGeocode({
        query: [parseFloat(lng), parseFloat(lat)]
      })
        .send()
        .then(response => {
          const address = response?.body?.features?.[0];
          this.geocoder.clear();
          this.geocoder.setPlaceholder(address?.place_name || "Somewhere");
          document.dispatchEvent(new CustomEvent(this.placeChangedTriggerNameSpace,
            [address, lat, lng, this.wrapElemSelector, this.locationInput]
          ))
        })
    } else {  // user entered an address
      document.dispatchEvent(new CustomEvent(this.placeChangedTriggerNameSpace,
        [place, lat, lng, this.wrapElemSelector, this.locationInput]
      ))
    }
  }

  handleAutoCompletePlaceChange(place) {
    if (!place.geometry) {
      // User entered the name of a Place that was not suggested and
      // pressed the Enter key, or the Place Details request failed.
      return;
    }
    var [lng, lat] = place.geometry.coordinates;
    this.updateLocationInput(lat, lng, place);
    this.fitBoundMarker()
  }
}