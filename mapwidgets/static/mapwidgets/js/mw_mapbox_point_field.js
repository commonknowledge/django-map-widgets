import { Application, Controller } from "https://unpkg.com/@hotwired/stimulus/dist/stimulus.js"

window.Stimulus = Application.start()

Stimulus.register("pointfield", class extends Controller {
  static targets = [ "lng", "lat", "map", "add", "remove"]

  static values = {
    'lng': Number,
    'lat': Number,
    'mapOptions': Object,
    'field': Object
  }

  connect() {
    this.syncValuesToInputs()
    this.setupMap()
    this.updateMarkerPosition()
    this.fitBoundMarker()
  }

  setupMap() {
    mapboxgl.accessToken = this.mapOptionsValue.access_token;

    this.mapboxSDK = new mapboxSdk({ accessToken: this.mapOptionsValue.access_token });

    this.map = new mapboxgl.Map({
      container: this.mapTarget, // container ID
      style: 'mapbox://styles/mapbox/streets-v11', // style URL
      center: [this.lng || 0, this.lat || 0], // starting position [lng, lat]
      zoom: 10 // starting zoom
    });

    this.map.on("click", this.handleMapClick.bind(this));

    this.map.addControl(this.createGeocoder())
    this.map.addControl(this.createGeolocator())
  }

  createGeocoder() {
    this.geocoder = new MapboxGeocoder({
      accessToken: mapboxgl.accessToken,
      zoom: 13,
      placeholder: 'Search a location',
      mapboxgl: mapboxgl,
      reverseGeocode: true,
      marker: false
    })

    this.geocoder.on('result', place => {
      this.setLngLat(
        place.result.geometry.coordinates[0],
        place.result.geometry.coordinates[1],
        place.result
      )
    })

    return this.geocoder
  }

  createGeolocator() {
    this.geolocator = new mapboxgl.GeolocateControl({
      positionOptions: {
        enableHighAccuracy: true
      },
      showUserLocation: false,
      trackUserLocation: false,
      showUserHeading: false
    })

    this.geolocator.on('geolocate', location => this.setLngLat(
      location.coords.longitude,
      location.coords.latitude
    ))

    return this.geolocator
  }

  handleMapClick(e) {
    this.setLngLat(e.lngLat.lng, e.lngLat.lat)
  }

  addMarkerToMap(lng, lat) {
    if (!this.map) return
    this.removeMarker();
    this.marker = new mapboxgl.Marker()
      .setLngLat([parseFloat(lng), parseFloat(lat)])
      .setDraggable(true)
      .addTo(this.map);

    this.marker.on("dragend", this.dragMarker.bind(this));
  }

  removeMarker() {
    this.marker?.remove()
    this.marker = undefined
  }

  fitBoundMarker() {
    if (this.marker) {
      this.map?.flyTo({
        center: this.marker.getLngLat(),
        zoom: 14
      });
    }
  }

  updateMarkerPosition() {
    if (!this.marker) {
      this.addMarkerToMap(...this.lngLatTuple)
    }
    this.marker?.setLngLat(this.lngLatTuple)
  }

  dragMarker() {
    const position = this.marker?.getLngLat()
    this.setLngLat(position.lng, position.lat)
  }

  lngValueChanged() { this.coordinatesChanged() }
  latValueChanged() { this.coordinatesChanged() }
  get hasCoords () { return !isNaN(this.lngValue) && !isNaN(this.latValue) }

  coordinatesChanged() {
    this.syncValuesToInputs()
    if (this.hasCoords) {
      this.updateMarkerPosition()
    } else {
      this.clear()
    }
  }

  setLngLat(lng, lat, place) {
    if (!lng || !lat) {
      this.clear()
    } else {
      this.lngValue = parseFloat(lng)
      this.latValue = parseFloat(lat)
      this.place = place
      if (!this.place) {
        this.updateNameOfPlace()
      }
    }
  }

  clear() {
    this.removeMarker()
    this.place = null
    this.lngValue = null
    this.latValue = null
  }

  get lngLatTuple() { return [this.lngValue, this.latValue] }
  get lngLatObject() { return { lng: this.lngValue, lat: this.latValue } }

  updateNameOfPlace() {
    this.mapboxSDK.geocoding.reverseGeocode({
      query: this.lngLatTuple
    })
      .send()
      .then(response => {
        const address = response?.body?.features?.[0];
        this.geocoder.clear();
        this.geocoder.setPlaceholder(address?.place_name || "Somewhere");
      })
  }

  syncInputsToValues() {
    this.lngValue = this.lngTarget.value
    this.latValue = this.latTarget.value
  }

  syncValuesToInputs(lng = this.lngValue, lat = this.latValue) {
    this.lngTarget.value = lng || ''
    this.latTarget.value = lat || ''
  }
})