/* -*- tab-width:4 -*- */

/*
 * Copyright (c) 2010 Eamonn O'Brien-Strain, eob@well.com
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which is available at http://www.eclipse.org/legal/epl-v10.html
 */

/*jslint devel: true */
/* declare globals to keep JSLint happy */
var Ajax, Mojo;   //framework
var nrbyInitData, LatLon; //model


/**
   Initialize everything and display default built-in photos while waiting for the network.
   @class A list of photos returned by a Flickr search, with a pointer to
   a current photo that can be moved left or right
  */
function Photos(status, info, alertUser, showPhotos, callAfterAcknowledgement) {
    Mojo.requireProperty(status, ['set', 'reset']);
    Mojo.requireProperty(info, 'set');
	Mojo.requireFunction(alertUser);
	Mojo.requireFunction(showPhotos);
	Mojo.requireFunction(callAfterAcknowledgement);

	var MILE, FOOT, MAX_AREA, AREA_CHANGE_MIN, AREA_CHANGE_MAX,
	    self, index, array, placeName, searchArea, noNearbyPhotos, areaChange, nextFetchMessage,
	    currentLatLon, prevLatLon;
    self = this;

	/* begin private members */

	AREA_CHANGE_MIN = 1.2;
	AREA_CHANGE_MAX = 10;
	areaChange = AREA_CHANGE_MAX;
	MAX_AREA = 32000 * 32000;  //m^2
	MILE = 1609.344;
    FOOT = 0.3048;

    searchArea = MAX_AREA; //m^2
	nextFetchMessage = '---';


    index = -1;
	array = [];
	placeName = "";
	prevLatLon = null;
	currentLatLon = null;

	/** The previous response from Flickr. */
	this.flickrResponse = null;

	/** Is there a satisfactory number of photos? */
	this.goodNumberOfPhotos = false;

	function radiusKm() {
	    return Math.round(Math.sqrt(searchArea)) / 1000;
	}


	function twoSignificant(r) {
	    var mult = 1;
		while (r >= 100) {
		    r /= 10;
			mult *= 10;
		}
		return mult * Math.round(r);
	}

	function metersMsg(r) {
	    if (Mojo.Locale.getCurrentFormatRegion() === 'us') {
			if (r < 500 * FOOT) {
				return twoSignificant(r / FOOT) + " ft";
			} else {
			    return (twoSignificant(10 * r / MILE) / 10) + " mi";
			}		
		} else {
			if (r < 400) {
				return twoSignificant(r) + " m";
			} else {
			    return (twoSignificant(r / 100) / 10) + " km";
			}
		}
	}

	function radiusMsg() {
	    return metersMsg(Math.sqrt(searchArea));
	}

	function isEqual(a, b) {
	    var i, n;
	    n = a.length;
	    if (b.length !== n) {
		    return false;
		}
		for (i = 0; i < n; i += 1) {
		    if (a[i].id !== b[i].id) {
			    return false;
			}
		}
		return true;
	}

	/** Expose photos received from Flickr.  Arrange photos
		...,9,7,5,3,1,0,2,4,6,8,...  so that most interesting are
		closest to center */
	function exposePhotos() {
	    var i, n;
		n = self.flickrResponse.photos.photo.length;
		for (i = 0; i < n; i += 1) {
			if (i % 2 === 0) { //even
				array[n / 2  +  i / 2] = self.flickrResponse.photos.photo[i];
			} else { //odd
				array[n / 2  -  (i + 1) / 2] = self.flickrResponse.photos.photo[i];
			}
		}
		if (n === 0) {
		  //do nothing
		} else if ((n % 2) === 0) {
		    index = n / 2;
		} else {
		    index = (n - 1) / 2;
		}
		if (index >= 0 && array.length > 0) {
		    //console.log('Fetching photo ' + array[index].title + ' ...');
			showPhotos(self.urlsLeft(), self.urlsCenter(), self.urlsRight());
			self.showInfo();
		}
	}

	function changeSearchArea(increase) {
	    if (increase) {
			searchArea *= areaChange;
			if (searchArea > MAX_AREA) {
				searchArea = MAX_AREA;
			}
			console.log("Increasing search radius by " + areaChange + " to " + radiusMsg());
		} else {
		    searchArea /= areaChange;
			console.log("Reducing search radius by " + areaChange + " to " + radiusMsg());
		}
	}

	function setPhotos(response) {
	    var total, n;

	    total = parseInt(response.photos.total, 10);
		n = response.photos.photo.length;
		console.log("displaying " + n + " of " + total + " photo");

		noNearbyPhotos = (total === 0 && searchArea === MAX_AREA);
		self.goodNumberOfPhotos = false;
		if (noNearbyPhotos) {
			console.log("!!!! Cannot find any photos nearby");
			areaChange = AREA_CHANGE_MAX;
		} else if (total < 100 && searchArea !== MAX_AREA) {
		    changeSearchArea(true);
			areaChange = 1 + (areaChange - 1) * 0.9;
			nextFetchMessage = 'Widening search to find more photos';
		} else if (total > 500) {
		    changeSearchArea(false);
			areaChange = 1 + (areaChange - 1) * 0.9;
			nextFetchMessage = 'Narrowing search to find closer photos';
		} else {
		    self.goodNumberOfPhotos = true;
			areaChange = AREA_CHANGE_MAX;
		}
		if (areaChange < AREA_CHANGE_MIN) {
		    areaChange = AREA_CHANGE_MIN;
		}
		if (searchArea === MAX_AREA) {
		    areaChange = AREA_CHANGE_MAX;
		}

		if (self.flickrResponse === null || self.flickrResponse.isInit === true) {
		    //first time, or init data
		    self.flickrResponse = response;
			exposePhotos();
		} else if (!isEqual(response.photos.photo, self.flickrResponse.photos.photo)) {
		    //photos have changes
		    self.flickrResponse = response;
			callAfterAcknowledgement("New photos are available", exposePhotos);
		}
	}

    function callFlickr(message, method, args, callback) {
	    var url, req;
		//console.log(message + " CALLING FLICKR " + method + "(" + args + ")");
	    url = 'http://api.flickr.com/services/rest/?method=flickr.' + method +
		'&api_key=' + Mojo.Controller.appInfo.flickrApiKey +
		'&' + args + '&format=json&nojsoncallback=1';
		//console.log("FLICKR URL " + url);
		status.set(message + '...');
		req = new Ajax.Request(url, {
		    method: 'get',
			onSuccess: function (transport) {
			    status.reset();
				var response, places, place, n, i, placeMsg, flickrSearchHandler;
				if (transport.responseText === '') {
					console.log("FLICKR RETURNED EMPTY RESPONSE");
					alertUser(message + " -- fail");
					return;
				}
				response = Mojo.parseJSON(transport.responseText);
				if (response.stat !== "ok") {
					alertUser("Error from Fickr", transport.responseText);
				} else {
				    callback(response);
				}
			},
		    onFailure: function () {
			    status.reset();
			    alertUser("Problem with " + message, method);
			}
		});
	}

	function hasPhotos() {
	    return index >= 0 && array.length > 0;
	}

	function leftIndex() {
	    return (index - 1 + array.length) % array.length;
	}

	function rightIndex() {
	    return (index + 1) % array.length;
	}

	function urls(i) {
	    var photo, result;
        photo = array[i];
		//console.log("i=" + i + ",photo=" + photo.title);
	    result = [photo.url_t, photo.url_m];
		//console.log("urls(" + i + ") returns " + result);
		return result;
	}

	/* begin public members that can access private members */

	/** Display title on URL on the info object.
	 @type void */
	this.showInfo = function () {
	    var photo, title, photoLatLon;
	    photo = array[index];
	    photoLatLon = new LatLon(photo.latitude, photo.longitude);
		title = "";
		if (currentLatLon !== null) {
		    title += metersMsg(currentLatLon.metersFrom(photoLatLon)) + " " + currentLatLon.directionTo(photoLatLon) + " ";
		}
		title += "\"" + photo.title + "\"";
		info.set(title, "http://www.flickr.com/photos/" + photo.owner + "/" + photo.id + "/");
	};

	/** Move current photo one to the left (wrapping around at the end) 
		@type void
	 */
	this.moveLeft = function () {
	    index = leftIndex();
	};

	/** Move current photo one to the right (wrapping around at the end)
	 @type void*/
	this.moveRight = function () {
	    index = rightIndex();
	};

	/** Return an array of two URLs for the photo to the left of
	 current photo, to a thumbnail and a medium size image
	 @type String[2] */
	this.urlsLeft = function () {
	    return urls(leftIndex());
	};

	/** Return an array of two URLs for the current photo, to a thumbnail and a medium size image 
		@type String[2]
	 */
	this.urlsCenter = function () {
		return urls(index);
	};

	/** Return an array of two URLs for the photo to the right of the
		current photo, to a thumbnail and a medium size image 
		@type String[2] */
	this.urlsRight = function () {
		return urls(rightIndex());
	};

	/** fetch new photos by doing a Flickr search
	 @type void */
	this.fetch = function (latLon) {
	    var radius, distanceMoved, movedMessage;
		currentLatLon = latLon;
		if (prevLatLon === null) {
		    distanceMoved = null;
			movedMessage = 'Searching for nearby photos';
		} else {
		    distanceMoved = latLon.metersFrom(prevLatLon);
			console.log("Moved " + distanceMoved + " meters " + prevLatLon.directionTo(latLon));
			if (distanceMoved > Math.sqrt(searchArea) / 10) {
			    movedMessage = 'Searching again because you have moved ' + 
				                metersMsg(distanceMoved) + ' ' + prevLatLon.directionTo(latLon);
			} else {
			    movedMessage = null;
			}
			
		}
		if (self.goodNumberOfPhotos && movedMessage === null) {
		    console.log("no need to fetch more photos");
		    return;
		} else if (noNearbyPhotos) {
			callFlickr(
				'No nearby photos.  Finding some elsewhere.',
				'photos.search',
				'&sort=interestingness-desc&user_id=35034364763@N01&extras=geo,date_taken,url_m,url_t&per_page=100',
				setPhotos
			);
		} else {
			radius = radiusKm();
			callFlickr(
				movedMessage === null ? nextFetchMessage : movedMessage,
				'photos.search',
				latLon.query() + '&radius=' + radius + '&extras=sort=interestingness-desc&min_upload_date=0&extras=geo,date_taken,url_m,url_t&per_page=100',
				setPhotos
			);
		}
		prevLatLon = latLon;
	};

	setPhotos(nrbyInitData);
}
