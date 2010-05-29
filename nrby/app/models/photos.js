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
var nrbyInitData; //model


function Photos(status, info, alertUser, showPhotos) {
    Mojo.requireProperty(status, ['set', 'reset']);
    Mojo.requireProperty(info, 'set');
	Mojo.requireFunction(alertUser);
	Mojo.requireFunction(showPhotos);

    var self, index, array, placeName, searchArea, MAX_AREA, noNearbyPhotos;
    self = this;


	MAX_AREA = 32000 * 32000;  //m^2
    searchArea = MAX_AREA; //m^2

	/* begin private members */

    index = -1;
	array = [];
	placeName = "";

	function radiusKm() {
	    return Math.round(Math.sqrt(searchArea)) / 1000;
	}

	function radiusMsg() {
	    var radius = Math.sqrt(searchArea);
	    return radius > 2000 ? (Math.round(radius / 1000) + " km") : (Math.round(radius) + " meters");
	}


	function setPhotos(response) {
	    var total, n, i;

	    total = parseInt(response.photos.total, 10);
		n = response.photos.photo.length;
		console.log("displaying " + n + " of " + total + " photo");

		noNearbyPhotos = (total === 0 && searchArea === MAX_AREA);
		if (noNearbyPhotos) {
			console.log("!!!! Cannot find any photos nearby");
		} else if (total < 100 && searchArea !== MAX_AREA) {
		    searchArea *= 2;
			if (searchArea > MAX_AREA) {
			    searchArea = MAX_AREA;
			}
			console.log(">>>>>> Increasing search radius to " + radiusMsg());
		} else if (total > 200) {
		    searchArea /= 2;
			console.log("<<<<<< Reducing search radius to " + radiusMsg());
		}



		// Arrange photos ...,9,7,5,3,1,0,2,4,6,8,...
		// so that most interesting are
		// closest to center
		for (i = 0; i < n; i += 1) {
			if (i % 2 === 0) { //even
				array[n / 2  +  i / 2] = response.photos.photo[i];
			} else { //odd
				array[n / 2  -  (i + 1) / 2] = response.photos.photo[i];
			}
		}
		//if (index === -1 || index >= n) {
		index = n / 2;
		//}
		if (index >= 0 && array.length > 0) {
		    console.log('Fetching photo ' + array[index].title + ' ...');
			showPhotos(self.urlsLeft(), self.urlsCenter(), self.urlsRight());
			console.log("about to showInfo");
			self.showInfo();
		}
	}

	

    function callFlickr(message, method, args, callback) {
	    var url, req;
		console.log(message + " CALLING FLICKR " + method + "(" + args + ")");
	    url = 'http://api.flickr.com/services/rest/?method=flickr.' + method +
		'&api_key=' + Mojo.Controller.appInfo.flickrApiKey +
		'&' + args + '&format=json&nojsoncallback=1';
		console.log("FLICKR URL " + url);
		status.set(message + '...');
		req = new Ajax.Request(url, {
		    method: 'get',
			onSuccess: function (transport) {
			    status.reset();
				var response, places, place, n, i, placeMsg, flickrSearchHandler;
				console.log("callFlickr callback " + transport.responseText);
				if (transport.responseText === '') {
					console.log("FLICKR RETURNED EMPTY RESPONSE");
					alertUser(message + " -- fail");
					return;
				}
				console.log("FLICKR RETURNED " + transport.responseText);
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

	/* begin public members that can access private members */

	self.showInfo = function () {
	    var photo, title;
	    photo = array[index];
		title = photo.title.trim() === "" ? "(see on Flickr)" : photo.title;
		console.log("showInfo()");
		info.set(title, "http://www.flickr.com/photos/" + photo.owner + "/" + photo.id + "/");
	};

	self.hasPhotos = function () {
	    return index >= 0 && array.length > 0;
	};

	self.moveLeft = function () {
	    index = self.leftIndex();
	};

	self.moveRight = function () {
	    index = self.rightIndex();
	};

	self.leftIndex = function () {
	    return (index - 1 + array.length) % array.length;
	};

	self.rightIndex = function () {
	    console.log("rightIndex()");
	    return (index + 1) % array.length;
	};

	function urls(i) {
	    var photo, result;
        photo = array[i];
		console.log("i=" + i + ",photo=" + photo.title);
	    result = [photo.url_t, photo.url_m];
		console.log("urls(" + i + ") returns " + result);
		return result;
	}

	self.urlsLeft = function () {
	    console.log("urlsLeft()");
	    return urls(self.leftIndex());
	};

	self.urlsCenter = function () {
	    console.log("urlsCenter()");
		return urls(index);
	};

	self.urlsRight = function () {
	    console.log("urlsRignt()");
		return urls(self.rightIndex());
	};

	self.fetch = function (latLon) {
	    var radius;
		if (noNearbyPhotos) {
			callFlickr(
				'No nearby photos.  Finding some elsewhere.',
				'photos.search',
				'&sort=interestingness-desc&user_id=35034364763@N01&extras=geo,date_taken,url_m,url_t&per_page=100',
				setPhotos
			);
		} else {
			radius = radiusKm();
			callFlickr(
				'searching Flickr for photos within ' + radiusMsg() + ' ',
				'photos.search',
				latLon + '&radius=' + radius + '&extras=sort=interestingness-desc&min_upload_date=0&extras=geo,date_taken,url_m,url_t&per_page=100',
				setPhotos
			);
		}
	};

	console.log("2: about to setPhotos");
	setPhotos(nrbyInitData);
}
