mxn.register('cloudmade', {	

	Mapstraction: {

		init: function(element, api) {
			var me = this;
			var opts = {
				key: cloudmade_key
			};
			if (typeof cloudmade_styleId != "undefined"){
				opts.styleId = cloudmade_styleId;
			}

			this.tileLayerControl = null;
			this.scaleControl = null;
			this.smallMapControl = null;
			this.largeMapControl = null;
			this.overviewMapControl = null;
			this._fireOnNextCall = [];
			this._fireQueuedEvents =  function() {
				var fireListCount = me._fireOnNextCall.length;
				if (fireListCount > 0) {
					var fireList = me._fireOnNextCall.splice(0, fireListCount);
					var handler;
					while ((handler = fireList.shift())) {
						handler();
					}
				}
			};
			
			var cloudmade = new CM.Tiles.CloudMade.Web(opts);
			this.maps[api] = new CM.Map(element, cloudmade);

			CM.Event.addListener(this.maps[api], 'load', function() {
				me._fireOnNextCall.push(function() {
					me.load.fire();
				});
			});
			
			CM.Event.addListener(this.maps[api], 'click', function(location,marker) {
				if ( marker && marker.mapstraction_marker ) {
					marker.mapstraction_marker.click.fire();
				}
				else if ( location ) {
					me.click.fire({'location': new mxn.LatLonPoint(location.lat(), location.lng())});
				}

				// If the user puts their own Google markers directly on the map
				// then there is no location and this event should not fire.
				if ( location ) {
					me.clickHandler(location.lat(),location.lng(),location,me);
				}
			});
			CM.Event.addListener(this.maps[api], 'moveend', function() {
				me.endPan.fire();
			});
			CM.Event.addListener(this.maps[api], 'zoomend', function() {
				me.changeZoom.fire();
			});

			// CloudMade insists that setCenter is called with a valid lat/long and a zoom
			// level before any other operation is called on the map. Surely a WTF moment.
			this.maps[api].setCenter(new CM.LatLng(0, 0), 12);
			this.loaded[api] = true;
		},

		applyOptions: function(){
			var map = this.maps[this.api];
			if (this.options.enableScrollWheelZoom) {
				map.enableScrollWheelZoom();
			}
			else {
				map.disableScrollWheelZoom();
			}
		},

		resizeTo: function(width, height){	
			this._fireQueuedEvents();
			this.maps[this.api].checkResize();
		},

		addControls: function( args ) {
			/* args = { 
			 *     pan:      true,
			 *     zoom:     'large' || 'small',
			 *     overview: true,
			 *     scale:    true,
			 *     map_type: true,
			 * }
			 */
			var map = this.maps[this.api];

			if ('zoom' in args) {
				var control = null;
				switch (args.zoom) {
					case 'small':
						this.smallMapControl = this.addSmallControls();
						break;
						
					case 'large':
						this.largeMapControl = this.addLargeControls();
						break;
						
					default:
						this.largeMapControl = this.addLargeControls();
						break;
				}	// end-switch (args.zoom);
			}

			else {
				if (this.smallMapControl !== null) {
					map.removeControl(this.smallMapControl);
					this.smallMapControl = null;
				}
				if (this.largeMapControl !== null) {
					map.removeControl(this.largeMapControl);
					this.largeMapControl = null;
				}
			}

			if ('overview' in args) {
				if (this.overviewMapControl === null) {
					this.overviewMapControl = new CM.OverviewMapControl();
					map.addControl(this.overviewMapControl);
				}
			}
			
			else {
				if (this.overviewMapControl !== null) {
					map.removeControl(this.overviewMapControl);
					this.overviewMapControl = null;
				}
			}
			
			if ('map_type' in args) {
				if (this.tileLayerControl === null) {
					this.tileLayerControl = this.addMapTypeControls();
				}
			}

			else {
				if (this.tileLayerControl !== null) {
					map.removeControl(this.tileLayerControl);
					this.tileLayerControl = null;
				}
			}
			
			if ('scale' in args) {
				if (this.scaleControl === null) {
					this.scaleControl = new CM.ScaleControl();
					map.addControl(this.scaleControl);
				}
			}
			
			else {
				if (this.scaleControl !== null) {
					map.removeControl(this.scaleControl);
					this.scaleControl = null;
				}
			}
		},

		addSmallControls: function() {
			var map = this.maps[this.api];
			var control = null;
			if (this.smallMapControl === null) {
				control = new CM.SmallMapControl();
				map.addControl(control);
			}
			
			else {
				control = this.smallMapControl;
			}
			
			return control;
			//map.addControl(new CM.SmallMapControl());
			//this.addControlsArgs.zoom = 'small';
		},

		addLargeControls: function() {
			var map = this.maps[this.api];
			var control = null;
			if (this.largeMapControl === null) {
				control = new CM.LargeMapControl();
				map.addControl(control);
			}
			
			else {
				control = this.largeMapControl;
			}
			
			return control;
			//map.addControl(new CM.LargeMapControl());
			//this.addControlsArgs.zoom = 'large';
		},

		addMapTypeControls: function() {
			var map = this.maps[this.api];
			var control = null;
			if (this.tileLayerControl === null) {
				control = new CM.TileLayerControl();
				map.addControl(control);
			}
			
			else {
				control = this.tileLaterControl;
			}
			
			return control;
			//map.addControl(new CM.TileLayerControl());
			//this.addControlsArgs.map_type = true;
		},

		dragging: function(on) {
			var map = this.maps[this.api];

			if (on) {
				map.enableDragging();
			} else {
				map.disableDragging();
			}
		},

		setCenterAndZoom: function(point, zoom) { 
			this._fireQueuedEvents();
			var map = this.maps[this.api];
			var pt = point.toProprietary(this.api);
			map.setCenter(pt, zoom);
		},

		addMarker: function(marker, old) {
			this._fireQueuedEvents();
			var map = this.maps[this.api];
			var pin = marker.toProprietary(this.api);
			map.addOverlay(pin);
			return pin;
		},

		removeMarker: function(marker) {
			this._fireQueuedEvents();
			var map = this.maps[this.api];
			marker.proprietary_marker.closeInfoWindow();
			map.removeOverlay(marker.proprietary_marker);
		},
		
		declutterMarkers: function(opts) {
			this._fireQueuedEvents();
			var map = this.maps[this.api];

			// TODO: Add provider code
		},

		addPolyline: function(polyline, old) {
			this._fireQueuedEvents();
			var map = this.maps[this.api];
			var pl = polyline.toProprietary(this.api);
			map.addOverlay(pl);
			return pl;
		},

		removePolyline: function(polyline) {
			this._fireQueuedEvents();
			var map = this.maps[this.api];
			map.removeOverlay(polyline.proprietary_polyline);
		},

		getCenter: function() {
			this._fireQueuedEvents();
			var map = this.maps[this.api];
			var pt = map.getCenter();

			return new mxn.LatLonPoint(pt.lat(), pt.lng());
		},

		setCenter: function(point, options) {
			this._fireQueuedEvents();
			var map = this.maps[this.api];
			var pt = point.toProprietary(this.api);
			if(typeof (options) != 'undefined' && options.pan) { map.panTo(pt); }
			else { map.setCenter(pt); }
		},

		setZoom: function(zoom) {
			this._fireQueuedEvents();
			var map = this.maps[this.api];
			map.setZoom(zoom);
		},

		getZoom: function() {
			this._fireQueuedEvents();
			var map = this.maps[this.api];
			return map.getZoom();
		},

		getZoomLevelForBoundingBox: function( bbox ) {
			this._fireQueuedEvents();
			var map = this.maps[this.api];
			// NE and SW points from the bounding box.
			var ne = bbox.getNorthEast();
			var sw = bbox.getSouthWest();

			var zoom = map.getBoundsZoomLevel(new CM.LatLngBounds(sw.toProprietary(this.api), ne.toProprietary(this.api)));
			return zoom;
		},

		setMapType: function(type) {
			this._fireQueuedEvents();
			var map = this.maps[this.api];

			// TODO: Are there any MapTypes for Cloudmade?

			switch(type) {
				case mxn.Mapstraction.ROAD:
					// TODO: Add provider code
					break;
				case mxn.Mapstraction.SATELLITE:
					// TODO: Add provider code
					break;
				case mxn.Mapstraction.HYBRID:
					// TODO: Add provider code
					break;
				default:
					// TODO: Add provider code
			}	 
		},

		getMapType: function() {
			this._fireQueuedEvents();
			var map = this.maps[this.api];

			// TODO: Are there any MapTypes for Cloudmade?

			return mxn.Mapstraction.ROAD;
			//return mxn.Mapstraction.SATELLITE;
			//return mxn.Mapstraction.HYBRID;

		},

		getBounds: function () {
			this._fireQueuedEvents();
			var map = this.maps[this.api];

			var box = map.getBounds();
			var sw = box.getSouthWest();
			var ne = box.getNorthEast();

			return new mxn.BoundingBox(sw.lat(), sw.lng(), ne.lat(), ne.lng());
		},

		setBounds: function(bounds){
			this._fireQueuedEvents();
			var map = this.maps[this.api];
			var sw = bounds.getSouthWest();
			var ne = bounds.getNorthEast();

			map.zoomToBounds(new CM.LatLngBounds(sw.toProprietary(this.api), ne.toProprietary(this.api)));
		},

		addImageOverlay: function(id, src, opacity, west, south, east, north, oContext) {
			this._fireQueuedEvents();
			var map = this.maps[this.api];

			// TODO: Add provider code
		},

		setImagePosition: function(id, oContext) {
			this._fireQueuedEvents();
			var map = this.maps[this.api];
			var topLeftPoint; var bottomRightPoint;

			// TODO: Add provider code

		},

		addOverlay: function(url, autoCenterAndZoom) {
			this._fireQueuedEvents();
			var map = this.maps[this.api];

			// TODO: Add provider code

		},

		addTileLayer: function(tile_url, opacity, copyright_text, min_zoom, max_zoom) {
			this._fireQueuedEvents();
			var map = this.maps[this.api];

			// TODO: Add provider code
		},

		toggleTileLayer: function(tile_url) {
			this._fireQueuedEvents();
			var map = this.maps[this.api];

			// TODO: Add provider code
		},

		getPixelRatio: function() {
			this._fireQueuedEvents();
			var map = this.maps[this.api];

			// TODO: Add provider code
		},

		mousePosition: function(element) {
			this._fireQueuedEvents();
			var map = this.maps[this.api];

			// TODO: Add provider code
		}
	},

	LatLonPoint: {

		toProprietary: function() {
			var cll = new CM.LatLng(this.lat,this.lon);
			return cll;
		},

		fromProprietary: function(point) {
			this.lat = point.lat();
			this.lon = point.lng();
		}

	},

	Marker: {

		toProprietary: function() {
			var pt = this.location.toProprietary(this.api);
			var options = {};

			if (this.iconUrl) {
				var cicon = new CM.Icon();
				cicon.image = this.iconUrl;
				if (this.iconSize) {
					cicon.iconSize = new CM.Size(this.iconSize[0], this.iconSize[1]);
					if (this.iconAnchor) {
						cicon.iconAnchor = new CM.Point(this.iconAnchor[0], this.iconAnchor[1]);
					}
				}
				if (this.iconShadowUrl) {
					cicon.shadow = this.iconShadowUrl;
					if (this.iconShadowSize) {
						cicon.shadowSize = new CM.Size(this.iconShadowSize[0], this.iconShadowSize[1]);
					}
				}
				options.icon = cicon;
			}
			if (this.labelText) {
				options.title = this.labelText;
			}
			var cmarker = new CM.Marker(pt, options);

			if (this.infoBubble) {
				cmarker.bindInfoWindow(this.infoBubble);
			}


			return cmarker;
		},

		openBubble: function() {		
			var pin = this.proprietary_marker;
			pin.openInfoWindow(this.infoBubble);
		},

		closeBubble: function() {
			var pin = this.proprietary_marker;
			pin.closeInfoWindow();
		},
		
		hide: function() {
			var pin = this.proprietary_marker;
			pin.hide();
		},

		show: function() {
			var pin = this.proprietary_marker;
			pin.show();
		},

		update: function() {
			// TODO: Add provider code
		}

	},

	Polyline: {

		toProprietary: function() {
			var pts = [];
			var poly;

			for (var i = 0,  length = this.points.length ; i< length; i++){
				pts.push(this.points[i].toProprietary(this.api));
			}
			if (this.closed || pts[0].equals(pts[pts.length-1])) {
				poly = new CM.Polygon(pts, this.color, this.width, this.opacity, this.fillColor || "#5462E3", this.opacity || "0.3");
			}
			else {
				poly = new CM.Polyline(pts, this.color, this.width, this.opacity);
			}
			return poly;
		},

		show: function() {
			this.proprietary_polyline.show();
		},

		hide: function() {
			this.proprietary_polyline.hide();
		}

	}

});
