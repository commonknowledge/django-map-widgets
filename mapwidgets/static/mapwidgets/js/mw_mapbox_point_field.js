import { Application, Controller } from "https://unpkg.com/@hotwired/stimulus/dist/stimulus.js"

window.Stimulus = Application.start()

Stimulus.register("pointfield", class extends Controller {
  static targets = [ "lng", "lat", "map", "add", "remove"]

  static values = {
    'lng': Number,
    'lat': Number,
    'mapOptions': Object,
    'field': Object,
  }

  source = 'django'

  connect() {
    this.setupMap()
    this.syncValuesToInputs()
    this.zoomToMarker()
  }

  /**
   * State
   */

  lngValueChanged() { this.coordinatesChanged() }
  latValueChanged() { this.coordinatesChanged() }
  get hasCoords () { return !isNaN(this.lngValue) && !isNaN(this.latValue) }
  get lngLatTuple() { return [this.lngValue, this.latValue] }
  get lngLatObject() { return { lng: this.lngValue, lat: this.latValue } }

  setState(lng, lat, place, source) {
    this.lngValue = parseFloat(lng)
    this.latValue = parseFloat(lat)
    this.place = place
    this.source = source
  }

  clear() {
    this.lngValue = null
    this.latValue = null
    this.place = null
    this.removeMarker()
  }

  coordinatesChanged() {
    if (this.source !== 'inputs') {
      this.syncValuesToInputs()
    }
    if (this.hasCoords) {
      this.updateMarkerPosition()
      if (!this.place) {
        this.updateNameOfPlace()
      }
      if (this.source !== 'map') {
        this.zoomToMarker()
      }
    } else {
      this.clear()
    }
  }

  updateNameOfPlace() {
    this.mapboxSDK?.geocoding.reverseGeocode({
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
    this.setState(
      this.lngTarget.value,
      this.latTarget.value,
      null,
      'inputs'
    )
  }

  syncValuesToInputs(lng = this.lngValue, lat = this.latValue) {
    this.lngTarget.value = lng || ''
    this.latTarget.value = lat || ''
  }

  /**
   * Map
   */

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
      this.setState(
        place.result.geometry.coordinates[0],
        place.result.geometry.coordinates[1],
        place.result,
        'geocoder'
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

    this.geolocator.on('geolocate', location => {
      this.setState(
        location.coords.longitude,
        location.coords.latitude,
        null,
        'geolocator'
      )
    })

    return this.geolocator
  }

  handleMapClick(e) {
    this.setState(
      e.lngLat.lng,
      e.lngLat.lat,
      null,
      'map'
    )
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

  zoomToMarker() {
    if (this.marker) {
      this.map?.flyTo({
        center: this.marker.getLngLat()
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
    this.setState(
      position.lng,
      position.lat,
      null,
      'map'
    )
  }
})