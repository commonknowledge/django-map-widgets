class DjangoMapWidgetBase {

  constructor(options) {
    Object.assign(this, options);

    this.coordinatesOverlayToggleBtn.addEventListener("click", this.toggleCoordinatesOverlay);
    this.coordinatesOverlayDoneBtn.addEventListener("click", this.handleCoordinatesOverlayDoneBtnClick);
    this.coordinatesOverlayInputs.addEventListener("change", this.handleCoordinatesInputsChange);
    this.addMarkerBtn.addEventListener("click", this.handleAddMarkerBtnClick);
    this.deleteBtn.addEventListener("click", this.resetMap);

    // if the the location field in a collapse on Django admin form, the map need to initialize again when the collapse open by user.
    if (document.querySelector(this.wrapElemSelector).closest('.module.collapse')) {
      // TODO: Fix this event listener
      document.addEventListener('show.fieldset', this.initializeMap);
    }

    // var autocomplete = new google.maps.places.Autocomplete(this.addressAutoCompleteInput, this.GooglePlaceAutocompleteOptions);
    // google.maps.event.addListener(autocomplete, 'place_changed', this.handleAutoCompletePlaceChange.bind(this, autocomplete));
    // google.maps.event.addDomListener(this.addressAutoCompleteInput, 'keydown', this.handleAutoCompleteInputKeyDown);
    // this.geocoder = new google.maps.Geocoder;
    // this.initializeMap();
  }

  initializeMap() {
    console.warn("Implement initializeMap method.");
  }

  updateMap(lat, lng) {
    console.warn("Implement updateMap method.");
  }

  addMarkerToMap(lat, lng) {
    console.warn("Implement this method for your map js library.");
  }

  fitBoundMarker() {
    console.warn("Implement this method for your map js library.");
  }

  removeMarker() {
    console.warn("Implement this method for your map js library.");
  }

  dragMarker(e) {
    console.warn("Implement dragMarker method.");
  }

  handleMapClick(e) {
    console.warn("Implement handleMapClick method.");
  }

  handleAddMarkerBtnClick(e) {
    console.warn("Implement handleAddMarkerBtnClick method.");
  }

  isInt(value) {
    return !isNaN(value) &&
      parseInt(Number(value)) === value &&
      !isNaN(parseInt(value, 10));
  }

  getLocationValues() {
    var latlng = this.locationInput.value.split(' ')
    var lat = latlng[2].replace(/[\(\)]/g, '');
    var lng = latlng[1].replace(/[\(\)]/g, '');
    return {
      "lat": lat,
      "lng": lng
    }
  }

  callPlaceTriggerHandler(lat, lng, place) {
    if (place === undefined) {
      var latlng = { lat: parseFloat(lat), lng: parseFloat(lng) };
      this.geocoder.geocode({ 'location': latlng }, function (results, status) {
        if (status === google.maps.GeocoderStatus.OK) {
          var placeObj = results[0] || {};
          this.addressAutoCompleteInput.value = placeObj.formatted_address || ""
          document.dispatchEvent(new CustomEvent(this.placeChangedTriggerNameSpace,
            [placeObj, lat, lng, this.wrapElemSelector, this.locationInput]
          ))
        }
      });
    } else {  // user entered an address
      document.dispatchEvent(new CustomEvent(this.placeChangedTriggerNameSpace,
        [place, lat, lng, this.wrapElemSelector, this.locationInput]
      ))
    }
  }

  updateLocationInput(lat, lng, place) {
    var location_input_val = "POINT (" + lng + " " + lat + ")";
    this.locationInput.value = location_input_val
    this.updateCoordinatesInputs(lat, lng);
    this.addMarkerToMap(lat, lng);
    if (Object.getOwnPropertyNames(this.locationFieldValue).length === 0) {
      document.dispatchEvent(new CustomEvent(this.markerCreateTriggerNameSpace,
        [place, lat, lng, this.wrapElemSelector, this.locationInput]
      ))
    } else {
      document.dispatchEvent(new CustomEvent(this.markerChangeTriggerNameSpace,
        [place, lat, lng, this.wrapElemSelector, this.locationInput]
      ))
    }

    this.callPlaceTriggerHandler(lat, lng, place);
    this.locationFieldValue = {
      "lng": lng,
      "lat": lat
    };
    this.deleteBtn.removeClass("mw-btn-default disabled").addClass("mw-btn-danger");
  }

  resetMap() {
    if (Object.getOwnPropertyNames(this.locationFieldValue).length === 0) {
      this.hideOverlay();
      this.locationInput.value = ""
      this.coordinatesOverlayInputs.value = ""
      this.addressAutoCompleteInput.value = ""
      this.addMarkerBtn.removeClass("active");
      this.removeMarker();
      this.deleteBtn.removeClass("mw-btn-danger").addClass("mw-btn-default disabled");
      document.dispatchEvent(new CustomEvent(this.markerDeleteTriggerNameSpace,
        [
          this.locationFieldValue.lat,
          this.locationFieldValue.lng,
          this.wrapElemSelector,
          this.locationInput
        ]
      ))
      this.locationFieldValue = null;
    }
  }

  toggleCoordinatesOverlay() {
    console.log("Toggling", this)
    this.coordinatesOverlayToggleBtn.classList.toggle("active");
    this.wrapElem.querySelector(".mw-coordinates-overlay").classList.toggle("hide");
  }

  updateCoordinatesInputs(lat, lng) {
    this.wrapElem.querySelector(".mw-overlay-latitude").value = lat || ""
    this.wrapElem.querySelector(".mw-overlay-longitude").value = lng || ""
  }

  handleCoordinatesInputsChange(e) {
    var lat = this.wrapElem.querySelector(".mw-overlay-latitude").value = ""
    var lng = this.wrapElem.querySelector(".mw-overlay-longitude").value = ""
    if (lat && lng) {
      this.updateLocationInput(lat, lng);
      this.fitBoundMarker();
    }
  }

  handleCoordinatesOverlayDoneBtnClick() {
    this.wrapElem.querySelector(".mw-coordinates-overlay").addClass("hide");
    this.coordinatesOverlayToggleBtn.removeClass("active");
  }

  handleMyLocationBtnClick() {
    this.showOverlay();
    if (navigator.geolocation) {
      navigator.geolocation.getCurrentPosition(
        this.handleCurrentPosition,
        this.handlecurrentPositionError
      );
    } else {
      this.handlecurrentPositionError();
    }

  }

  handleCurrentPosition(location) {
    this.updateLocationInput(location.coords.latitude, location.coords.longitude);
    this.hideOverlay();
    this.fitBoundMarker();
  }

  handlecurrentPositionError() {
    this.hideOverlay();
    alert("Your location could not be found.");
  }

  handleAutoCompleteInputKeyDown(e) {
    var keyCode = e.keyCode || e.which;
    if (keyCode === 13) {  // pressed enter key
      e.preventDefault();
      return false;
    }
  }

  handleAutoCompletePlaceChange(autocomplete) {
    var place = autocomplete.getPlace();
    if (!place.geometry) {
      // User entered the name of a Place that was not suggested and
      // pressed the Enter key, or the Place Details request failed.
      return;
    }
    var lat = place.geometry.location.lat();
    var lng = place.geometry.location.lng();
    this.updateLocationInput(lat, lng, place);
    this.fitBoundMarker()
  }


  showOverlay() {
    this.loaderOverlayElem.removeClass("hide")
  }

  hideOverlay() {
    this.loaderOverlayElem.addClass("hide")
  }
}