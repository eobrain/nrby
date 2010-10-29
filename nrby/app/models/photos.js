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


	var MILE, FOOT, MAX_AREA, IDEAL_PHOTO_COUNT,
	    self, index, array, placeName, searchArea, noNearbyPhotos, density,
	  currentLatLon, prevLatLon, flickrResponse, goodNumberOfPhotos;
    self = this;

	/* begin private members */

	IDEAL_PHOTO_COUNT = 200;
	MAX_AREA = 32000 * 32000;  //m^2
	MILE = 1609.344;
    FOOT = 0.3048;

    searchArea = MAX_AREA; //m^2
	density = IDEAL_PHOTO_COUNT / MAX_AREA;


    index = -1;
	array = [];
	placeName = "";
	prevLatLon = null;
	currentLatLon = null;

	/** this funtion is actually attached to a Photo object --  get photo page of photo 
       @type String */
	function photoPage() {
		return "http://www.flickr.com/photos/" + this.owner + "/" + this.id + "/";
	}
	
	flickrResponse = null;  // The previous response from Flickr.

	goodNumberOfPhotos = false; //Is there a satisfactory number of photos? */

	function densityMsg(d) {
	    return (1000000 * d) + " photos/km^2";
	}

	function updatePhotoDensity(photoCount) {
	    var confidence, densityNew;
		console.log("radius=" + Math.sqrt(searchArea) + ", photoCount=" + photoCount);
		if (photoCount === 0) {
		    density /= 10;
			console.log("No photos, so let's greatly reduce the assumed density");
		} else {
			//more confident with more photos
			confidence = photoCount / (photoCount + 10);
			densityNew = photoCount / searchArea;

			console.log("density was " + densityMsg(density) + ", now " + densityMsg(densityNew) +
						" with a confidence of " + confidence);
			density += confidence * (densityNew - density);
		}
		console.log("density now " + densityMsg(density));
	}

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
	function exposePhotos(photoArray) {
	    var i, n, center, permuted;
		n = photoArray.length;
		console.log(n === 0 ? "no photos to expose" : "exposing " + photoArray[0].title);
		if (n === 0) {
		    return;
		}
		center = ((n % 2) === 0)  ?  n / 2  :  (n - 1) / 2;
		for (i = 0; i < n; i += 1) {
			if (i % 2 === 0) { //even
				permuted = center  +  i / 2;
			} else { //odd
				permuted = center  -  (i + 1) / 2;
			}
			array[permuted] = photoArray[i];
			array[permuted].photoPage = photoPage;
		}
		index = center;
		if (index >= 0 && array.length > 0) {
		    console.log('Fetching photo ' + array[index].title + ' ...');
			showPhotos(self.urlsLeft(), self.urlsCenter(), self.urlsRight());
			self.showInfo();
		}
	}

	function changeSearchArea(photoCount) {
	    var idealSearchArea, newSearchArea, change;
	    updatePhotoDensity(photoCount);
		idealSearchArea = IDEAL_PHOTO_COUNT / density;
		newSearchArea = Math.sqrt(idealSearchArea * searchArea);
		if (newSearchArea > MAX_AREA) {
		    console.log("search radius " + Math.sqrt(newSearchArea) + " exceeds max " + Math.sqrt(MAX_AREA));
		    newSearchArea = MAX_AREA;
		}

		//wheather search area has not significantly changed
		
		change =  Math.abs(newSearchArea - searchArea) / (newSearchArea + searchArea);

		console.log("Changing search radius " + Math.sqrt(searchArea) + " --> " +  
					Math.sqrt(newSearchArea) + " CHANGE=" + change);
		goodNumberOfPhotos = change < 0.2;
		if (goodNumberOfPhotos) {
		    console.log("Not changing search area because it has not changed much");
		} else {
		    if (newSearchArea > searchArea) {
			    console.log("Increasing radius from " + Math.sqrt(searchArea) + 
							" to " + Math.sqrt(newSearchArea));
			} else {
			    console.log("Reducing radius from " + Math.sqrt(searchArea) + 
							" to " + Math.sqrt(newSearchArea));
			}
			searchArea = newSearchArea;
		}
	}

	function setPhotos(response) {
	    var total, n;

	    total = parseInt(response.photos.total, 10);
		n = response.photos.photo.length;
		console.log("Flickr returned " + n + " of " + total + " photo");
		if (n > 0) {
		    console.log("first photo is " + response.photos.photo[0].title);
		}

		noNearbyPhotos = (total === 0 && searchArea === MAX_AREA);
		goodNumberOfPhotos = false;

		if (!noNearbyPhotos) {
		    changeSearchArea(total);
		}


		if (flickrResponse === null || flickrResponse.isInit === true) {
		    //first time, or init data
		    flickrResponse = response;
			exposePhotos(flickrResponse.photos.photo);
		} else if (n > 0 && !isEqual(response.photos.photo, flickrResponse.photos.photo)) {
		    //photos have changes
		    flickrResponse = response;
		    console.log("After button press should expose " + flickrResponse.photos.photo[0].title);
			callAfterAcknowledgement("New photos are available", function () {
				exposePhotos(flickrResponse.photos.photo);
			});
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

	/** get center photo 
       @type String */
	this.center = function () {
		return array[index];
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
			if (distanceMoved > 0) {
				console.log("Moved " + distanceMoved + " meters " + prevLatLon.directionTo(latLon));
			}
			if (distanceMoved > Math.sqrt(searchArea) / 10) {
			    movedMessage = 'Searching. You have moved ' + 
				                metersMsg(distanceMoved) + ' ' + prevLatLon.directionTo(latLon);
			} else {
			    movedMessage = null;
			}
			
		}
		if (goodNumberOfPhotos && movedMessage === null) {
		    //console.log("no need to fetch more photos");
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
				movedMessage === null ? 'Searching for nearby photos' : movedMessage,
				'photos.search',
				latLon.query() + '&radius=' + radius + 
				'&extras=sort=interestingness-desc&min_upload_date=0&extras=geo,date_taken,url_m,url_t&per_page=100',
				setPhotos
			);
		}
		prevLatLon = latLon;
	};

	setPhotos(nrbyInitData);
}


/* * get photo page of photo 
       @type String * /
Photos.photoPage = function (photo) {
	return "http://www.flickr.com/photos/" + photo.owner + "/" + photo.id + "/";
}*/

	

