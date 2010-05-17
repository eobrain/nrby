/* -*- tab-width:4 -*- */

/*
 * Copyright (c) 2010 Eamonn O'Brien-Strain, eob@well.com
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which is available at http://www.eclipse.org/legal/epl-v10.html
 */

/*jslint devel: true */

/* declare globals to keep JSLint happy */
var Ajax, Mojo, $;

function FirstAssistant() {
	/* this is the creator function for your scene assistant object. It will be passed all the 
	   additional parameters (after the scene name) that were passed to pushScene. The reference
	   to the scene controller (this.controller) has not be established yet, so any initialization
	   that needs the scene controller should be done in the setup function below. */
}


/* this function is for setup tasks that have to happen when the scene is first created */
FirstAssistant.prototype.setup = function () {
    var assistant, ctl, placeName, photos, photoIndex, prevTime;


	assistant = this; //for use in lambda functions
    ctl = this.controller;

	this.attributes = {
		//noExtractFS : true	//optional, turn off using extractfs to speed up renders.
	};
	this.model = {
		background: 'black',  
		onLeftFunction : function (event) {
	    }.bind(this),
		onRightFunction : function (event) {
	    }.bind(this)
	};

	this.controller.setupWidget('ImageId', this.attributes, this.model);

	this.myPhotoDivElement = $('ImageId');

	Mojo.Event.listen(
	    this.controller.get('ImageId'), 
		Mojo.Event.imageViewChanged, 
		function (event) {
		    /* Do something when the image view changes */
		    assistant.myPhotoDivElement.mojo.manualSize(Mojo.Environment.DeviceInfo.screenWidth, Mojo.Environment.DeviceInfo.screenHeight);
		}.bindAsEventListener(this)
	);



    function callFlickr(method, args, callback) {
	    var url, req;
		console.log("CALLING FLICKR " + method + "(" + args + ")");
	    url = 'http://api.flickr.com/services/rest/?method=flickr.' + method +
		'&api_key=' + Mojo.Controller.appInfo.flickrApiKey +
		'&' + args + '&format=json&nojsoncallback=1';
		req = new Ajax.Request(url, {
	        method: 'get',
		    onSuccess: callback,
		    onFailure: function () {
			    assistant.showDialogBox("Problem calling Flickr", method);
			}
		});
	}

	placeName = "";
	photos = [];
	photoIndex = -1;
	prevTime = 0;

	function now() {
	    var d = new Date();
		return d.getTime();
	}

	function photoUrlBase(photo) {
	    return 'http://farm' + photo.farm +
			  '.static.flickr.com/' + photo.server + 
			  '/' +  photo.id +
			  '_' +  photo.secret;
	}

		
	function showPhoto() {
	    var photo, urlBase;
		if (photoIndex >= 0 && photos.length > 0) {
			photo = photos[photoIndex];
			photoIndex = (photoIndex + 1) % photos.length;
			console.log("title=" + photo.title);
			urlBase = photoUrlBase(photo);
			console.log("PHOTO URL BASE " + urlBase);
			//ctl.get("nrby-photo").src = url;
			assistant.myPhotoDivElement.mojo.leftUrlProvided(urlBase + '_d.jpg', urlBase + '_m_d.jpg');
			assistant.myPhotoDivElement.mojo.centerUrlProvided(urlBase + '_d.jpg', urlBase + '_m_d.jpg');
			assistant.myPhotoDivElement.mojo.rightUrlProvided(urlBase + '_d.jpg', urlBase + '_m_d.jpg');
			
			//ctl.get("nrby-title").update(photo.title);
		}
	}

    ctl.serviceRequest('palm://com.palm.location', {
	    method : 'startTracking',
		parameters: { subscribe: true },
		onSuccess: function (response) {

		    /* throttle the calls to Flickr */
		    if ((now() - prevTime) < 10000) {
			    return;  /* too soon */
			}
			prevTime = now();

		    console.log("Lat/Lon = " + response.latitude + "," + response.longitude);
			callFlickr(
			    'places.findByLatLon',
				'lat=' + response.latitude + '&lon=' + response.longitude,
				function (transport) {
				    var response, places, place, n, i, placeMsg, flickrSearchHandler;
					console.log("FLICKR RETURNED " + transport.responseText);
				    response = Mojo.parseJSON(transport.responseText);
					if (response.stat !== "ok") {
						assistant.showDialogBox("Error from Fickr", transport.responseText);
					} else {
					    places = response.places.place;
						if (places.length === 0) {
						    console.log("FLickr could not find a place");
						    return;
						}
						place = places[0]; 

						if (place.name === placeName) {
						    showPhoto();
						    return;
						}
						placeName = place.name;
						//ctl.get("nrby-place").update(placeName);

						flickrSearchHandler = function (transport) {
						    var response;
						    console.log("PHOTO SEARCH returns " + transport.responseText);
							response = Mojo.parseJSON(transport.responseText);
							if (response.stat !== "ok") {
								assistant.showDialogBox("Error from Fickr", transport.responseText);
							} else {
							    photos = response.photos.photo;
								photoIndex = 0;
								showPhoto();
							}
						};
						callFlickr(
						    'photos.search',
							'sort=interestingness-desc&place_id=' + place.place_id,
							flickrSearchHandler
							);
					}

				}
			);
		},
	    onFailure: function (response) {
		    assistant.showDialogBox("Problem calling Flickr", response);
		}
	});

};



FirstAssistant.prototype.activate = function (event) {
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */
};

FirstAssistant.prototype.deactivate = function (event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
};

FirstAssistant.prototype.cleanup = function (event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
	Mojo.Event.stopListening(this.controller.get('ImageId'), Mojo.Event.imageViewChanged, this.imageViewChanged);
};

// This function will popup a dialog, displaying the message passed in.
FirstAssistant.prototype.showDialogBox = function (title, message) {
    this.controller.showAlertDialog({
	    onChoose: function (value) {},
		title: title,
		message: message,
		choices: [ {label: 'OK', value: 'OK', type: 'color'} ]
	});
}; 
