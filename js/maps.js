/**
 * SMARTCARE – Google Maps & Location Navigation Engine
 * 
 * Features:
 * - Google Maps JavaScript API + Google Places Autocomplete
 * - Interactive location picking with draggable markers & click-to-pinpoint
 * - Reverse geocoding to automatically fetch & update lat, lng & address
 * - Patient multi-hospital navigation with GPS geolocation & turn-by-turn driving directions
 * - Zero-failure fallback mode for seamless Android mobile and desktop experience
 */

class SmartCareMapsManager {
  constructor() {
    this.adminMap = null;
    this.adminMarker = null;
    this.adminAutocomplete = null;
    this.patientMap = null;
    this.patientMarkers = [];
    this.directionsService = null;
    this.directionsRenderer = null;
    this.userLocationMarker = null;
    this.isGoogleMapsLoaded = false;
    this.isLoadingScript = false;
    this.pendingCallbacks = [];
  }

  /**
   * Load Google Maps JavaScript API with Places and Geometry libraries
   */
  loadGoogleMaps(callback) {
    if (this.isGoogleMapsLoaded && window.google?.maps?.places) {
      if (callback) callback(true);
      return;
    }

    if (callback) {
      this.pendingCallbacks.push(callback);
    }

    if (this.isLoadingScript) return;
    this.isLoadingScript = true;

    const apiKey = window.SMARTCARE_CONFIG?.getGoogleMapsApiKey();
    const isConfigured = window.SMARTCARE_CONFIG?.isGoogleMapsConfigured();

    if (!isConfigured) {
      console.warn('[GoogleMaps] API key not yet configured in config.js or Admin settings. Running interactive coordinate engine.');
      this.isLoadingScript = false;
      this.executeCallbacks(false);
      return;
    }

    // Define global callback for Google Maps JSONP
    window.initSmartCareGoogleMaps = () => {
      console.log('%c[GoogleMaps] Google Maps JavaScript & Places API Loaded Successfully!', 'color: #10b981; font-weight: bold;');
      this.isGoogleMapsLoaded = true;
      this.isLoadingScript = false;
      this.executeCallbacks(true);
    };

    // Remove any existing script tag
    const existingScript = document.getElementById('google-maps-api-script');
    if (existingScript) existingScript.remove();

    const script = document.createElement('script');
    script.id = 'google-maps-api-script';
    script.async = true;
    script.defer = true;
    script.src = `https://maps.googleapis.com/maps/api/js?key=${encodeURIComponent(apiKey)}&libraries=places,geometry&callback=initSmartCareGoogleMaps`;
    script.onerror = (err) => {
      console.error('[GoogleMaps] Failed to load Google Maps script:', err);
      this.isLoadingScript = false;
      this.executeCallbacks(false);
    };

    document.head.appendChild(script);
  }

  executeCallbacks(success) {
    while (this.pendingCallbacks.length > 0) {
      const cb = this.pendingCallbacks.shift();
      try { cb(success); } catch (e) { console.error('Maps callback error', e); }
    }
  }

  /**
   * ADMIN: Initialize interactive Hospital Location Picker Map
   * Supports Google Places Autocomplete, Map Click, and Marker Drag
   */
  initAdminMapPicker(containerId, options = {}) {
    const container = document.getElementById(containerId);
    if (!container) return;

    const defaultLat = options.initialLat || 12.9716;
    const defaultLng = options.initialLng || 77.5946;
    const initialPos = { lat: parseFloat(defaultLat), lng: parseFloat(defaultLng) };

    const onLocationChange = options.onLocationChange || (() => {});

    // If Google Maps is available
    if (window.google?.maps) {
      container.innerHTML = '';
      const mapOptions = {
        center: initialPos,
        zoom: 15,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        gestureHandling: 'greedy', // optimized for mobile touch
        styles: [
          { elementType: 'geometry', stylers: [{ color: '#1e293b' }] },
          { elementType: 'labels.text.stroke', stylers: [{ color: '#0f172a' }] },
          { elementType: 'labels.text.fill', stylers: [{ color: '#94a3b8' }] },
          { featureType: 'road', elementType: 'geometry', stylers: [{ color: '#334155' }] },
          { featureType: 'water', elementType: 'geometry', stylers: [{ color: '#0284c7' }] }
        ]
      };

      this.adminMap = new google.maps.Map(container, mapOptions);

      this.adminMarker = new google.maps.Marker({
        position: initialPos,
        map: this.adminMap,
        draggable: true,
        animation: google.maps.Animation.DROP,
        title: 'Selected Hospital Location'
      });

      // Map Click listener -> Move pin and update coordinates
      this.adminMap.addListener('click', (e) => {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        this.updateAdminMarkerPosition(lat, lng, onLocationChange);
      });

      // Marker Drag listener
      this.adminMarker.addListener('dragend', (e) => {
        const lat = e.latLng.lat();
        const lng = e.latLng.lng();
        this.updateAdminMarkerPosition(lat, lng, onLocationChange);
      });

      // Attach Google Places Autocomplete to address input
      const addressInput = document.getElementById('hospital-form-address');
      if (addressInput && google.maps.places) {
        if (!this.adminAutocomplete) {
          this.adminAutocomplete = new google.maps.places.Autocomplete(addressInput, {
            fields: ['geometry', 'name', 'formatted_address', 'place_id']
          });

          this.adminAutocomplete.addListener('place_changed', () => {
            const place = this.adminAutocomplete.getPlace();
            if (!place.geometry || !place.geometry.location) {
              console.warn('Place selected has no geometry location');
              return;
            }

            const lat = place.geometry.location.lat();
            const lng = place.geometry.location.lng();
            this.adminMap.setCenter(place.geometry.location);
            this.adminMap.setZoom(16);
            this.updateAdminMarkerPosition(lat, lng, onLocationChange, place.formatted_address, place.name);
          });
        }
      }
    } else {
      // Responsive interactive coordinates pinpoint UI if API key is pending
      this.renderInteractivePickerFallback(container, initialPos, onLocationChange);
    }
  }

  updateAdminMarkerPosition(lat, lng, callback, explicitAddress = null, explicitName = null) {
    if (this.adminMarker) {
      this.adminMarker.setPosition({ lat, lng });
    }

    // Try reverse geocoding if Google Maps is present and address not provided
    if (window.google?.maps?.Geocoder && !explicitAddress) {
      const geocoder = new google.maps.Geocoder();
      geocoder.geocode({ location: { lat, lng } }, (results, status) => {
        const address = (status === 'OK' && results[0]) ? results[0].formatted_address : `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
        if (callback) callback(lat, lng, address, explicitName);
      });
    } else {
      const address = explicitAddress || `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
      if (callback) callback(lat, lng, address, explicitName);
    }
  }

  setAdminPickerCoordinates(lat, lng, address = '') {
    const pos = { lat: parseFloat(lat), lng: parseFloat(lng) };
    if (this.adminMap && this.adminMarker) {
      this.adminMap.setCenter(pos);
      this.adminMap.setZoom(16);
      this.adminMarker.setPosition(pos);
    }
  }

  /**
   * Fallback interactive map picker (using OpenStreetMap iframe & real Nominatim search)
   */
  renderInteractivePickerFallback(container, initialPos, onLocationChange) {
    let currentLat = initialPos.lat;
    let currentLng = initialPos.lng;

    container.innerHTML = `
      <div class="relative w-full h-full min-h-[360px] bg-slate-950 rounded-xl overflow-hidden border border-slate-700">
        <!-- Interactive Map Iframe -->
        <iframe 
          id="admin-picker-osm-frame"
          class="w-full h-full min-h-[360px] border-0"
          src="https://www.openstreetmap.org/export/embed.html?bbox=${currentLng - 0.01}%2C${currentLat - 0.01}%2C${currentLng + 0.01}%2C${currentLat + 0.01}&amp;layer=mapnik&amp;marker=${currentLat}%2C${currentLng}"
        ></iframe>

        <!-- Quick Pinpoint Overlay Controls -->
        <div class="absolute top-3 left-3 right-3 sm:right-auto bg-slate-900/95 backdrop-blur-md p-3 rounded-xl border border-sky-500/40 shadow-xl max-w-sm">
          <div class="text-[11px] font-bold text-sky-400 uppercase tracking-wider flex items-center gap-1.5">
            <span>📍</span> Pinpoint Location on Map
          </div>
          <div class="text-xs text-slate-300 mt-1">
            Current Coordinates: <strong id="picker-preview-coords" class="text-white font-mono">${currentLat.toFixed(5)}, ${currentLng.toFixed(5)}</strong>
          </div>
          <div class="flex gap-2 mt-2">
            <button type="button" id="picker-btn-use-gps" class="px-2.5 py-1.5 rounded-lg bg-sky-600 hover:bg-sky-500 text-white font-bold text-[10px] flex items-center gap-1">
              <span>🎯</span> Use Current GPS
            </button>
            <button type="button" id="picker-btn-search-osm" class="px-2.5 py-1.5 rounded-lg bg-slate-800 hover:bg-slate-700 text-slate-200 text-[10px] border border-slate-700">
              <span>🔍</span> Search Address
            </button>
          </div>
        </div>
      </div>
    `;

    const gpsBtn = container.querySelector('#picker-btn-use-gps');
    if (gpsBtn) {
      gpsBtn.onclick = () => {
        if (navigator.geolocation) {
          navigator.geolocation.getCurrentPosition(
            (pos) => {
              const lat = pos.coords.latitude;
              const lng = pos.coords.longitude;
              this.refreshOsmFrame(container, lat, lng, onLocationChange);
            },
            (err) => {
              alert('Could not access GPS location. Please allow location access or type coordinates.');
            },
            { enableHighAccuracy: true }
          );
        }
      };
    }

    const searchBtn = container.querySelector('#picker-btn-search-osm');
    if (searchBtn) {
      searchBtn.onclick = async () => {
        const address = document.getElementById('hospital-form-address')?.value.trim();
        const name = document.getElementById('hospital-form-name')?.value.trim();
        const query = address || name;
        if (!query) {
          alert('Please enter a Hospital Name or Address first to search on the map.');
          return;
        }

        try {
          searchBtn.innerText = 'Searching...';
          const res = await fetch(`https://nominatim.openstreetmap.org/search?format=json&q=${encodeURIComponent(query)}&limit=1`);
          const data = await res.json();
          if (data && data.length > 0) {
            const lat = parseFloat(data[0].lat);
            const lng = parseFloat(data[0].lon);
            this.refreshOsmFrame(container, lat, lng, onLocationChange, data[0].display_name);
          } else {
            alert('Location not found. Please verify the address.');
          }
        } catch (e) {
          console.warn('Geocoding search error:', e);
        } finally {
          searchBtn.innerHTML = '<span>🔍</span> Search Address';
        }
      };
    }
  }

  refreshOsmFrame(container, lat, lng, callback, address = '') {
    const frame = container.querySelector('#admin-picker-osm-frame');
    if (frame) {
      frame.src = `https://www.openstreetmap.org/export/embed.html?bbox=${lng - 0.01}%2C${lat - 0.01}%2C${lng + 0.01}%2C${lat + 0.01}&amp;layer=mapnik&amp;marker=${lat}%2C${lng}`;
    }
    const preview = container.querySelector('#picker-preview-coords');
    if (preview) {
      preview.innerText = `${lat.toFixed(5)}, ${lng.toFixed(5)}`;
    }
    if (callback) {
      callback(lat, lng, address);
    }
  }

  /**
   * PATIENT: Initialize Hospital Navigation Map with all registered hospitals
   */
  initPatientHospitalMap(containerId, hospitals = [], onHospitalSelect = null) {
    const container = document.getElementById(containerId);
    if (!container) return;

    if (hospitals.length === 0) {
      container.innerHTML = `
        <div class="w-full h-full min-h-[380px] flex flex-col items-center justify-center p-6 text-center bg-slate-900/60 rounded-2xl border border-dashed border-slate-700">
          <div class="w-12 h-12 rounded-2xl bg-sky-950/60 border border-sky-500/30 flex items-center justify-center text-sky-400 text-2xl mb-3">🏥</div>
          <h4 class="text-white font-bold text-sm">No Hospitals Registered Yet</h4>
          <p class="text-slate-400 text-xs mt-1.5 max-w-sm">
            Hospitals registered by the Hospital Administrator with Google Maps locations will dynamically appear here for real-time navigation.
          </p>
        </div>
      `;
      return;
    }

    const firstHospital = hospitals[0];
    const initialCenter = {
      lat: parseFloat(firstHospital.latitude || 12.9716),
      lng: parseFloat(firstHospital.longitude || 77.5946)
    };

    if (window.google?.maps) {
      container.innerHTML = '';
      this.patientMap = new google.maps.Map(container, {
        center: initialCenter,
        zoom: 12,
        mapTypeId: google.maps.MapTypeId.ROADMAP,
        gestureHandling: 'greedy'
      });

      this.directionsService = new google.maps.DirectionsService();
      this.directionsRenderer = new google.maps.DirectionsRenderer({
        map: this.patientMap,
        suppressMarkers: false,
        polylineOptions: {
          strokeColor: '#0284c7',
          strokeWeight: 5,
          strokeOpacity: 0.8
        }
      });

      const bounds = new google.maps.LatLngBounds();
      this.patientMarkers = [];

      hospitals.forEach((h, idx) => {
        const lat = parseFloat(h.latitude);
        const lng = parseFloat(h.longitude);
        if (isNaN(lat) || isNaN(lng)) return;

        const pos = { lat, lng };
        bounds.extend(pos);

        const marker = new google.maps.Marker({
          position: pos,
          map: this.patientMap,
          title: h.name,
          animation: google.maps.Animation.DROP
        });

        const infoWindow = new google.maps.InfoWindow({
          content: `
            <div style="color: #0f172a; padding: 4px; font-family: sans-serif;">
              <strong style="font-size: 14px; color: #0369a1;">${h.name}</strong>
              <div style="font-size: 11px; color: #475569; margin-top: 3px;">${h.address || ''}</div>
              <div style="font-size: 11px; color: #0d9488; font-weight: bold; margin-top: 3px;">📞 ${h.contactPhone || h.phone || ''}</div>
            </div>
          `
        });

        marker.addListener('click', () => {
          infoWindow.open(this.patientMap, marker);
          if (onHospitalSelect) onHospitalSelect(h);
        });

        this.patientMarkers.push({ marker, hospital: h });
      });

      if (hospitals.length > 1) {
        this.patientMap.fitBounds(bounds);
      }
    } else {
      // Dynamic OSM Frame showing all hospitals
      const markersQuery = hospitals.map(h => `${h.latitude}%2C${h.longitude}`).join('&marker=');
      container.innerHTML = `
        <div class="relative w-full h-full min-h-[380px] bg-slate-950 rounded-2xl overflow-hidden border border-slate-700 shadow-xl">
          <iframe 
            class="w-full h-full min-h-[380px] border-0"
            src="https://www.openstreetmap.org/export/embed.html?bbox=${initialCenter.lng - 0.05}%2C${initialCenter.centerLat || initialCenter.lat - 0.05}%2C${initialCenter.lng + 0.05}%2C${initialCenter.lat + 0.05}&amp;layer=mapnik&amp;marker=${initialCenter.lat}%2C${initialCenter.lng}"
          ></iframe>
        </div>
      `;
    }
  }

  /**
   * Filter visible markers on patient map based on search query
   */
  filterPatientMarkers(query) {
    const q = (query || '').toLowerCase().trim();
    if (!this.patientMarkers || this.patientMarkers.length === 0) return;

    this.patientMarkers.forEach(({ marker, hospital }) => {
      const match = !q || 
        (hospital.name && hospital.name.toLowerCase().includes(q)) ||
        (hospital.address && hospital.address.toLowerCase().includes(q)) ||
        (hospital.city && hospital.city.toLowerCase().includes(q));

      marker.setVisible(match);
    });
  }

  /**
   * Calculate and render turn-by-turn route on patient map
   */
  renderRouteOnMap(originLat, originLng, destLat, destLng) {
    if (!this.directionsService || !this.directionsRenderer) return;

    const origin = new google.maps.LatLng(originLat, originLng);
    const destination = new google.maps.LatLng(destLat, destLng);

    this.directionsService.route(
      {
        origin,
        destination,
        travelMode: google.maps.TravelMode.DRIVING
      },
      (result, status) => {
        if (status === google.maps.DirectionsStatus.OK) {
          this.directionsRenderer.setDirections(result);
        } else {
          console.warn('Directions request failed due to:', status);
        }
      }
    );
  }

  /**
   * Generate official Google Maps turn-by-turn navigation URL
   * Opens Google Maps App on Android or web browser navigation on Desktop
   */
  getDirectionsUrl(userLat, userLng, hospitalLat, hospitalLng, hospitalName = '') {
    if (userLat && userLng) {
      return `https://www.google.com/maps/dir/?api=1&origin=${userLat},${userLng}&destination=${hospitalLat},${hospitalLng}&travelmode=driving`;
    }
    // Fallback if user GPS not granted
    return `https://www.google.com/maps/dir/?api=1&destination=${hospitalLat},${hospitalLng}&travelmode=driving`;
  }
}

window.SMARTCARE_MAPS = new SmartCareMapsManager();
