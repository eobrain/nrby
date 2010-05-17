/* -*- tab-width:4 -*- */

/*
 * Copyright (c) 2010 Eamonn O'Brien-Strain, eob@well.com
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which is available at http://www.eclipse.org/legal/epl-v10.html
 */

/*jslint devel: true */

/* declare globals to keep JSLint happy */
var Ajax, Mojo, $, window;

function FirstAssistant() {
	/* this is the creator function for your scene assistant object. It will be passed all the 
	   additional parameters (after the scene name) that were passed to pushScene. The reference
	   to the scene controller (this.controller) has not be established yet, so any initialization
	   that needs the scene controller should be done in the setup function below. */
}


FirstAssistant.prototype.orientationChanged = function (orientation) {
    var viewer;
    // you will be passed "left", "right", "up", or "down" (and maybe others?)
    console.log("orientationChanged(" + orientation + ")");
	viewer = $('ImageId');
	switch (orientation) {
	case "up":   //normal portrait
	case "down": //reverse portrait
		viewer.mojo.manualSize(Mojo.Environment.DeviceInfo.screenWidth, 
							   Mojo.Environment.DeviceInfo.screenHeight);
		break;
	case "left":  //left side down
	case "right": //right side down
		viewer.mojo.manualSize(Mojo.Environment.DeviceInfo.screenHeight, 
							 Mojo.Environment.DeviceInfo.screenWidth);
		break;
	default:
		//do nothing
		break;
	}
};

/* this function is for setup tasks that have to happen when the scene is first created */
FirstAssistant.prototype.setup = function () {
    var assistant, viewer, appCtl, ctl, placeName, photos, photoIndex, prevTime, resize;


	assistant = this; //for use in lambda functions
    ctl = this.controller;
	viewer = $('ImageId');

	function photoUrlBase(photo) {
	    return 'http://farm' + photo.farm +
			  '.static.flickr.com/' + photo.server + 
			  '/' +  photo.id +
			  '_' +  photo.secret;
	}

	function urlBaseLeft() {
	    console.log("urlBaseLeft  photoIndex=" + photoIndex + " photos.length=" + photos.length);
	    return photoUrlBase(photos[(photoIndex - 1 + photos.length) % photos.length]);
	}

	function urlBaseCenter() {
	    console.log("urlBaseCenter  photoIndex=" + photoIndex + " photos.length=" + photos.length);
	    return photoUrlBase(photos[photoIndex]);
	}

	function urlBaseRight() {
	    console.log("urlBaseRight  photoIndex=" + photoIndex + " photos.length=" + photos.length);
	    return photoUrlBase(photos[(photoIndex + 1) % photos.length]);
	}

	this.attributes = {
		//noExtractFS : true	//optional, turn off using extractfs to speed up renders.
	};
	this.model = {
		background: 'black',  
		onLeftFunction : function (event) {
		    photoIndex = (photoIndex - 1 + photos.length) % photos.length;
		    viewer.mojo.leftUrlProvided(urlBaseLeft() + '_d.jpg', urlBaseLeft() + '_m_d.jpg');
	    }.bind(this),
		onRightFunction : function (event) {
		    photoIndex = (photoIndex + 1) % photos.length;
		    viewer.mojo.rightUrlProvided(urlBaseRight() + '_d.jpg', urlBaseRight() + '_m_d.jpg');
	    }.bind(this)
	};

	this.controller.setupWidget('ImageId', this.attributes, this.model);

    appCtl = Mojo.Controller.getAppController();
    resize = function (event) {
	    console.log(" ====== resize(" + event + ")");
	    FirstAssistant.prototype.orientationChanged(appCtl.getScreenOrientation());
	}.bindAsEventListener(this);

	Mojo.Event.listen(this.controller.get('ImageId'), Mojo.Event.imageViewChanged, resize);



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

		
	function showPhoto() {
		console.log("showPhoto() photoIndex=" + photoIndex);
		if (photoIndex >= 0 && photos.length > 0) {
		    viewer.mojo.leftUrlProvided(urlBaseLeft() + '_d.jpg', urlBaseLeft() + '_m_d.jpg');
		    viewer.mojo.centerUrlProvided(urlBaseCenter() + '_d.jpg', urlBaseCenter() + '_m_d.jpg');
		    viewer.mojo.rightUrlProvided(urlBaseRight() + '_d.jpg', urlBaseRight() + '_m_d.jpg');
		}
		console.log("FINISHED showPhoto()");
	}

    ctl.serviceRequest('palm://com.palm.location', {
	    method : 'startTracking',
		parameters: { subscribe: true },
		onSuccess: function (response) {

		    /* throttle the calls to Flickr */
		    if ((now() - prevTime) < 60000) {
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
						    //showPhoto();
						    return;
						}
						placeName = place.name;
						//ctl.get("nrby-place").update(placeName);

						flickrSearchHandler = function (transport) {
						    var response;
						    console.log("PHOTO SEARCH returns " + transport.responseText);
							response = Mojo.parseJSON(transport.responseText);
							if (response.stat !== "ok") {
							    console.log("Error from flickr.photo.search transport.resonseText");
								assistant.showDialogBox("Error from Fickr", transport.responseText);
							} else {
							    n = response.photos.photo.length;

							    console.log("photo search returned " + n + " photos");

								// Arrange photos ...,9,7,5,3,1,0,2,4,6,8,...
								// so that most interesting are
								// closest to center
								for (i = 0; i < n; i += 1) {
								    if (i % 2 === 0) { //even
									    photos[n / 2  +  i / 2] = response.photos.photo[i];
										console.log(i + " --> " + (n / 2  +  i / 2));
								    } else { //odd
									    photos[n / 2  -  (i + 1) / 2] = response.photos.photo[i];
										console.log(i + " --> " + (n / 2  -  (i + 1) / 2));
									}
								}
								photoIndex = n / 2;
								showPhoto();
							}
						};
						console.log("about to call flickr.photos.search ...");
						callFlickr(
						    'photos.search',
							'per_page=10&sort=interestingness-desc&place_id=' + place.place_id,
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
	//Mojo.Event.stopListening(this.controller.get('ImageId'), Mojo.Event.imageViewChanged, this.imageViewChanged);
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
