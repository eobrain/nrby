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
    var assistant, viewer, appCtl, ctl, photos;

	assistant = this; //for use in lambda functions

	assistant.status = {
	    element: $('nrbyStatus'),
		set: function (message) {
	        this.element.update(message);
	        this.element.style.display = 'block';
	    },
	    reset: function () {
	        this.element.update('-------');
	        this.element.style.display = 'none';	  
	    }
	};

    ctl = this.controller;
	viewer = $('ImageId');

	ctl.enableFullScreenMode(true);

	function photoUrlBase(photo) {
	    return 'http://farm' + photo.farm +
			  '.static.flickr.com/' + photo.server + 
			  '/' +  photo.id +
			  '_' +  photo.secret;
	}

	photos = {
	    index: -1,
        array: [],

		leftIndex: function () {
		    return (this.index - 1 + this.array.length) % this.array.length;
	    },

	    rightIndex: function () {
		    return this.array[(this.index + 1) % this.array.length];
	    },

		urlBaseLeft: function () {
	        console.log("urlBaseLeft  photoIndex=" + this.index + " photos.length=" + this.array.length);
			return photoUrlBase(this.array[this.leftIndex()]);
	    },
		urlBaseCenter: function () {
	        console.log("urlBaseCenter  photoIndex="  + this.index + " photos.length=" + this.array.length);
	        return photoUrlBase(this.array[this.index]);
	    },

	    urlBaseRight: function () {
	        console.log("urlBaseRight  photoIndex=" + this.index + " photos.length=" + this.array.length);
			return photoUrlBase(this.rightIndex());
		}
		
	};
    assistant.photos = photos;

	this.provideUrl = function (provided, urlBase) {
	    provided(urlBase + '_d.jpg', urlBase + '_m_d.jpg');
	};

	this.attributes = {
		//noExtractFS : true	//optional, turn off using extractfs to speed up renders.
	};
	this.model = {
		background: 'black',  
		onLeftFunction : function (event) {
		    photos.index = photos.leftIndex();
		    assistant.provideUrl(viewer.mojo.leftUrlProvided, photos.urlBaseLeft());
	    }.bind(this),
		onRightFunction : function (event) {
		    photos.index = photos.rightIndex();
		    assistant.provideUrl(viewer.mojo.rightUrlProvided, photos.urlBaseRight());
	    }.bind(this)
	};


	this.controller.setupWidget('ImageId', this.attributes, this.model);

    appCtl = Mojo.Controller.getAppController();
    this.imageViewChanged = function (event) {
	    console.log(" ====== imageViewChanged(" + event + ")");
	    FirstAssistant.prototype.orientationChanged(appCtl.getScreenOrientation());
		assistant.status.reset();
	}.bindAsEventListener(this);

	Mojo.Event.listen(this.controller.get('ImageId'), Mojo.Event.imageViewChanged, this.imageViewChanged);



		
	//this.controller.setInitialFocusedElement(null);
}; //setup



FirstAssistant.prototype.activate = function (event) {
    var assistant, photos, placeName, prevTime, viewer;
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */

	assistant = this; //for use in lambda functions
	photos = assistant.photos;
	prevTime = 0;
	placeName = "";
	viewer = $('ImageId');

	function now() {
	    var d = new Date();
		return d.getTime();
	}


    function callFlickr(message, method, args, callback) {
	    var url, req;
		console.log(message + " CALLING FLICKR " + method + "(" + args + ")");
	    url = 'http://api.flickr.com/services/rest/?method=flickr.' + method +
		'&api_key=' + Mojo.Controller.appInfo.flickrApiKey +
		'&' + args + '&format=json&nojsoncallback=1';
		assistant.status.set(message + '...');
		req = new Ajax.Request(url, {
		    method: 'get',
			onSuccess: function (transport) {
			    assistant.status.reset();
			    callback(transport);
			},
		    onFailure: function () {
			    assistant.status.reset();
			    assistant.showDialogBox("Problem with " + message, method);
			}
		});
	}

	function showPhoto() {
		console.log("showPhoto() photoIndex=" + photos.index);
		if (photos.index >= 0 && photos.array.length > 0) {
			assistant.status.set('Fetching photo ' + photos.array[photos.index].title + '...');
		    assistant.provideUrl(viewer.mojo.leftUrlProvided,   photos.urlBaseLeft());
		    assistant.provideUrl(viewer.mojo.centerUrlProvided, photos.urlBaseCenter());
		    assistant.provideUrl(viewer.mojo.rightUrlProvided,  photos.urlBaseRight());
		}
		console.log("FINISHED showPhoto()");
	}



    this.controller.serviceRequest('palm://com.palm.location', {
	    method : 'startTracking',
		parameters: { subscribe: true },
		onSuccess: function (response) {
		    var latLon;

			if (response.latitude === 0 && response.longitude === 0) {
			    console.log("FLICKR RETURNED ZEROS FOR LAT/LON " + response);
				return;
			}
		    latLon = 'lat=' + response.latitude + '&lon=' + response.longitude;

		    /* throttle the calls to Flickr */
		    if ((now() - prevTime) < 10000 /*Mojo.Controller.appInfo.periodMillisec*/) {
			    return;  /* too soon */
			}
			prevTime = now();

		    console.log(latLon);
			callFlickr(
				'Asking Flickr what is the name of this location',
			    'places.findByLatLon',
				latLon,
				function (transport) {
				    var response, places, place, n, i, placeMsg, flickrSearchHandler;
					console.log("callFlickr callback " + transport.responseText);
					if (transport.responseText === '') {
					    console.log("FLICKR RETURNED EMPTY RESPONSE");
						assistant.showDialogBox("Cannot lookup location on Flickr");
						return;
					}
					console.log("FLICKR RETURNED " + transport.responseText);
				    response = Mojo.parseJSON(transport.responseText);
					if (response.stat !== "ok") {
						assistant.showDialogBox("Error from Fickr", transport.responseText);
					} else {
					    places = response.places.place;
						if (places.length === 0) {
						    console.log("Flickr could not find a place");
							assistant.showDialogBox("Flickr could not find a place at  = " + latLon);
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
							console.log("callFlickr callback " + transport.responseText);
							if (transport.responseText === '') {
							    assistant.showDialogBox("No photos returned from Flickr");
							    return;
							}
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
										photos.array[n / 2  +  i / 2] = response.photos.photo[i];
										console.log(i + " --> " + (n / 2  +  i / 2));
									} else { //odd
										photos.array[n / 2  -  (i + 1) / 2] = response.photos.photo[i];
										console.log(i + " --> " + (n / 2  -  (i + 1) / 2));
									}
								}
								photos.index = n / 2;
								showPhoto();
							}
						};
						console.log("about to call flickr.photos.search ...");
						callFlickr(
							'Searching ' + placeName,
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
    console.log('\n' + 
				'********************\n' +
				'* ' + title + '\n' +
				'********************\n' + 
				'* ' + message + '\n' +
				'********************\n');
    this.controller.showAlertDialog({
	    onChoose: function (value) {},
		title: title,
		message: message,
		choices: [ {label: 'OK', value: 'OK', type: 'color'} ]
	});
}; 
