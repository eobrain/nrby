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
var nrbyInitData, LatLon, Inactivity, nrbyPreferences; //model



/**
   Initialize everything and display default built-in photos while waiting for the network.
   @class A list of photos returned by a Flickr search, with a pointer to
   a current photo that can be moved left or right
   @constructor
  */
function Photos() {

	var MAX_AREA, IDEAL_PHOTO_COUNT,
	feedback,
	self, index, array, placeName, searchArea, noNearbyPhotos, density, info,
	refreshInactivity, recentlyHasChanged, currentLatLon, flickrResponse, goodNumberOfPhotos;

    self = this;

	info = Mojo.Log.info;

	/* begin private members */

	refreshInactivity = new Inactivity(10000);

	IDEAL_PHOTO_COUNT = 200;
	MAX_AREA = 32000 * 32000;  //m^2

    searchArea = MAX_AREA; //m^2
	density = IDEAL_PHOTO_COUNT / MAX_AREA;


    index = -1;
	array = [];
	placeName = "";
	currentLatLon = null;

	/** this function is actually attached to a Photo object --  get photo page of photo 
       @type String */
	function photoPage() {
		return "http://www.flickr.com/photos/" + this.owner + "/" + this.id + "/";
	}
	
	flickrResponse = null;  // The previous response from Flickr.

	goodNumberOfPhotos = false; //Is there a satisfactory number of photos? */

	function densityMsg(d) {
	    return (1000000 * d) + " photos/km^2";
	}

	Number.prototype.sqrtMetersLocalized = function () {
		return Math.sqrt(this).metersLocalized();
	};

	function updatePhotoDensity(photoCount) {
	    var confidence, densityNew;
		info("radius=", searchArea.sqrtMetersLocalized(), ", photoCount=", photoCount);
		if (photoCount === 0) {
		    density /= 10;
			info("No photos, so let's greatly reduce the assumed density");
		} else {
			//more confident with more photos
			confidence = photoCount / (photoCount + 10);
			densityNew = photoCount / searchArea;

			info("density was ", densityMsg(density), ", now ", densityMsg(densityNew),
						  " with a confidence of ", confidence);
			density += confidence * (densityNew - density);
		}
		info("density now ", densityMsg(density));
	}

	function radiusKm() {
	    return Math.round(Math.sqrt(searchArea)) / 1000;
	}


	function radiusMsg() {
	    return searchArea.sqrtMetersLocalized();
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
		if (n === 0) {
			Mojo.Log.warn("no photos to expose");
		    return;
		}
		info("exposing ", photoArray[0].title);
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
		    info('Fetching photo "', array[index].title, '" ...');
			self.refreshPhotoView();
		}
	}

	function changeSearchArea(photoCount) {
	    var idealSearchArea, newSearchArea, change;
	    updatePhotoDensity(photoCount);
		idealSearchArea = IDEAL_PHOTO_COUNT / density;
		newSearchArea = Math.sqrt(idealSearchArea * searchArea);
		if (newSearchArea > MAX_AREA) {
		    info("search radius ", newSearchArea.sqrtMetersLocalized(), 
				 " exceeds max ", MAX_AREA.sqrtMetersLocalized());
		    newSearchArea = MAX_AREA;
		}

		//wheather search area has not significantly changed
		
		change =  Math.abs(newSearchArea - searchArea) / (newSearchArea + searchArea);

		info("Changing search radius ", searchArea.sqrtMetersLocalized(), " --> ",  
					  newSearchArea.sqrtMetersLocalized(), " CHANGE=", change);
		goodNumberOfPhotos = change < 0.2;
		if (goodNumberOfPhotos) {
		    info("Not changing search area because it has not changed much");
		} else {
		    if (newSearchArea > searchArea) {
			    info("Increasing radius from ", searchArea.sqrtMetersLocalized(), 
							  " to ", newSearchArea.sqrtMetersLocalized());
			} else {
			    info("Reducing radius from ", searchArea.sqrtMetersLocalized(), 
							  " to ", newSearchArea.sqrtMetersLocalized());
			}
			searchArea = newSearchArea;
		}
	}

	function setPhotos(response) {
	    var total, n;

	    total = parseInt(response.photos.total, 10);
		n = response.photos.photo.length;
		info("Flickr returned ", n, " of ", total, " photo");
		if (n > 0) {
		    info("first photo is ", response.photos.photo[0].title);
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
			refreshInactivity.execWhenInactive(function () {
				exposePhotos(flickrResponse.photos.photo);
			});
		}
	}

    function callFlickr(message, method, args, callback) {
	    var url, req;
	    url = 'http://api.flickr.com/services/rest/?method=flickr.' + method +
		'&api_key=' + Mojo.Controller.appInfo.flickrApiKey +
		'&' + args + '&format=json&nojsoncallback=1';
		feedback.status.set(message + '...');
		req = new Ajax.Request(url, {
		    method: 'get',
			onSuccess: function (transport) {
			    feedback.status.reset();
				var response, places, place, n, i, placeMsg, flickrSearchHandler;
				if (transport.responseText === '') {
					feedback.alertUser("Flickr returned an empty response", message);
					return;
				}
				response = Mojo.parseJSON(transport.responseText);
				if (response.stat !== "ok") {
					feedback.alertUser("Error response from Fickr", transport.responseText);
				} else {
				    callback(response);
				}
			},
		    onFailure: function () {
			    feedback.status.reset();
				feedback.status.set("Flickr failed when " + method + ' called ');
			    //feedback.alertUser("Flickr failed when " + method + ' called ', message);
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
	    result = [photo.url_t, photo.url_m];
		return result;
	}

	/* begin public members that can access private members */

	/** set the feedback object used to send feedback back to the user */
	this.setFeedback = function (fb) {
		feedback = fb;
		Mojo.requireProperty(feedback.status,      ['set', 'reset']);
		Mojo.requireFunction(feedback.alertUser,  'feedback.alertUser');
		Mojo.requireFunction(feedback.showPhotos, 'feedback.showPhotos');
	};

	/** Make view in sync with model */
	this.refreshPhotoView = function () {
		feedback.showPhotos(self.urlsLeft(), self.urlsCenter(), self.urlsRight());
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

	/** The geographical position of the device when these photos were fetched */
	this.latLon = null;

	recentlyHasChanged = false;
	nrbyPreferences.setRecentlyHook(function (v) {
		recentlyHasChanged = true;
	});

	/** fetch new photos by doing a Flickr search
	 @type void */
	this.fetch = function (latLon) {
	    var distanceMoved, movedMessage, searchingMessage, flickrArgs, sort;
		currentLatLon = latLon;
		searchingMessage = (nrbyPreferences.getRecently() ? 
							'Searching for recent photos' : "Searching for interesting photos") + " within " + radiusMsg();
		if (self.latLon === null || recentlyHasChanged) {
		    distanceMoved = null;
			movedMessage = searchingMessage;
		} else {
		    distanceMoved = latLon.metersFrom(self.latLon);
			if (distanceMoved > 0) {
				info("Moved ", distanceMoved, " meters ", self.latLon.directionTo(latLon));
			}
			if (distanceMoved > Math.sqrt(searchArea) / 10) {
			    movedMessage = 'You have moved ' + 
				    distanceMoved.metersLocalized() + ' ' + self.latLon.directionTo(latLon) + 
					". Searching within " + radiusMsg();
			} else {
			    movedMessage = null;
			}
			
		}//
		recentlyHasChanged = false;
		flickrArgs = '&extras=geo,date_taken,url_m,url_t,license,owner_name&per_page=100&';
		if (goodNumberOfPhotos && movedMessage === null) {
		    return;
		} else if (noNearbyPhotos) {
			callFlickr(
				'No nearby photos.  Finding some elsewhere.',
				'photos.search',
				flickrArgs + 'user_id=35034364763@N01',
				setPhotos
			);
		} else {
			//Normal case
			sort = nrbyPreferences.getRecently() ? "sort=date-posted-desc" : "sort=interestingness-desc";
			callFlickr(
				movedMessage === null ? searchingMessage : movedMessage,
				'photos.search',
				latLon.query() + '&radius=' + radiusKm() + 
					"&" + sort +
					flickrArgs + 'min_upload_date=0',
				setPhotos
			);
			//});
		}
		self.latLon = latLon;
	};

	/** Initialize with some dummy photos to view while waiting for real photos to load */
	this.fillWithInitData = function () {
		feedback.status.set('Showing some placeholder photos while waiting.');
		setPhotos(nrbyInitData);
	};
}

/** Parse a timestamp of the form  "YYYY-MM-DD hh:mm:ss" and return a Date object */
String.prototype.parseFlickrDate = function () {
	var dateTime, date, time,
	    year, month, day, hour, min, sec;
	dateTime = this.split(' ');
	date = dateTime[0].split('-');
	time = dateTime[1].split(':');
	year =  parseInt(date[0], 10);
	month = parseInt(date[1], 10) - 1;
	day =   parseInt(date[2], 10);
	hour =  parseInt(time[0], 10);
	min =   parseInt(time[1], 10);
	sec =   parseInt(time[2], 10);
	return new Date(year, month, day, hour, min, sec);
};


