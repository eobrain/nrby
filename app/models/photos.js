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

function Photos(status, alertUser, showPhotos) {
    var self, index, array, placeName;
    self = this;

	/* begin private members */

    index = -1;
	array = [];
	placeName = "";

	function setPhotos(response) {
		var n, i;
		n = response.photos.photo.length;

		console.log("photo search returned " + n + " photos");

		// Arrange photos ...,9,7,5,3,1,0,2,4,6,8,...
		// so that most interesting are
		// closest to center
		for (i = 0; i < n; i += 1) {
			if (i % 2 === 0) { //even
				array[n / 2  +  i / 2] = response.photos.photo[i];
				console.log(i + " --> " + (n / 2  +  i / 2));
			} else { //odd
				array[n / 2  -  (i + 1) / 2] = response.photos.photo[i];
				console.log(i + " --> " + (n / 2  -  (i + 1) / 2));
			}
		}
		if (index === -1 || index >= n) {
		    index = n / 2;
		}
		if (index >= 0 && array.length > 0) {
			status.set('Fetching photo ' + array[index].title + '...');
			showPhotos(self.urlBaseLeft(), self.urlBaseCenter(), self.urlBaseRight());
		}
	}


	function photoUrlBase(photo) {
		return 'http://farm' + photo.farm +
			  '.static.flickr.com/' + photo.server + 
			  '/' +  photo.id +
			  '_' +  photo.secret;
	}

    function callFlickr(message, method, args, callback) {
	    var url, req;
		console.log(message + " CALLING FLICKR " + method + "(" + args + ")");
	    url = 'http://api.flickr.com/services/rest/?method=flickr.' + method +
		'&api_key=' + Mojo.Controller.appInfo.flickrApiKey +
		'&' + args + '&format=json&nojsoncallback=1';
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
	    return array[(index + 1) % array.length];
	};

	self.urlBaseLeft = function () {
	    console.log("urlBaseLeft  photoIndex=" + index + " photos.length=" + array.length);
		return photoUrlBase(array[self.leftIndex()]);
	};

	self.urlBaseCenter = function () {
		console.log("urlBaseCenter  photoIndex="  + index + " photos.length=" + array.length);
		return photoUrlBase(array[index]);
	};

	self.urlBaseRight = function () {
		console.log("urlBaseRight  photoIndex=" + index + " photos.length=" + array.length);
		return photoUrlBase(self.rightIndex());
	};

	self.fetch = function (latLon) {
		callFlickr(
			'searching Flickr for nearby photos',
			'photos.search',
			latLon + '&radius=31&min_upload_date=0&extras=geo,date_taken,url_m,url_t&per_page=100',
			setPhotos
		);
	};

	setPhotos(nrbyInitData);
}
