/* -*- tab-width:4 -*- */

/*
 * Copyright (c) 2010 Eamonn O'Brien-Strain, eob@well.com
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which is available at http://www.eclipse.org/legal/epl-v10.html
 */

/*jslint devel: true */

/* declare globals to keep JSLint happy */
var Mojo, $, window; //framework
var Photos, LatLon;  //models

/** @class The controller for the one and only scene in this app. */
function FirstAssistant() {
}

/** Handle the event of the user rotating the device, resizing the image viewer accordingly. */
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
		$('continueButton').style.top = (Mojo.Environment.DeviceInfo.screenHeight - 60) + "px";
		break;
	case "left":  //left side down
	case "right": //right side down
		viewer.mojo.manualSize(Mojo.Environment.DeviceInfo.screenHeight, 
							 Mojo.Environment.DeviceInfo.screenWidth);
		$('continueButton').style.top = (Mojo.Environment.DeviceInfo.screenWidth - 60) + "px";
		break;
	default:
		//do nothing
		break;
	}
};

/** Setup the ImageViewer widget and various callback functions to be sent to the model. */
FirstAssistant.prototype.setup = function () {
    var assistant, viewerModel, buttonModel, viewer, appCtl, ctl;

	viewer = $('ImageId');

	assistant = this; //for use in lambda functions

	/** A display area used for brief status messages. */
	this.status = {
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

    this.controller.enableFullScreenMode(true);

	/** pass the two URLs as arguments to the provided function */
	this.provideUrl = function (provided, urls) {
	    console.log("provdeUrl");
	    provided(urls[1], urls[0]);
	};

	viewerModel = {
		background: 'black',  
		onLeftFunction : function (event) {
		    assistant.photos.moveLeft();
		    assistant.provideUrl(viewer.mojo.leftUrlProvided, assistant.photos.urlsLeft());
			assistant.photos.showInfo();
	    }.bind(this),
		onRightFunction : function (event) {
		    assistant.photos.moveRight();
		    assistant.provideUrl(viewer.mojo.rightUrlProvided, assistant.photos.urlsRight());
			assistant.photos.showInfo();
	    }.bind(this)
	};

    buttonModel = {
	    label : "Refresh",
	    disabled: false
	};

	this.controller.setupWidget('ImageId', {}, viewerModel);
	this.controller.setupWidget("continueButton", {}, buttonModel);

    appCtl = Mojo.Controller.getAppController();

	/** callback function used to respond to new photo being displayed by ImageViewer */
    this.imageViewChanged = function (event) {
	    console.log(" ====== imageViewChanged(" + event + ")");
	    FirstAssistant.prototype.orientationChanged(appCtl.getScreenOrientation());
		assistant.status.reset();
	}.bindAsEventListener(this);

	Mojo.Event.listen(this.controller.get('ImageId'), Mojo.Event.imageViewChanged, this.imageViewChanged);
}; //setup


/** Create the Photos model object, and start listening for GPS location events. */
FirstAssistant.prototype.activate = function (event) {
    var assistant, prevTime, viewer, info, button;
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */

	console.log("activate(..)");
	viewer = $('ImageId');
    button = $('continueButton');
	assistant = this; //for use in lambda functions

	info = {
	    element: $('nrbyInfoLink'),
		set: function (message, url) {
		    console.log("info.set(" + message + "," + url + ")");
	        this.element.update(message);
			this.element.setAttribute('href', url);
	        //this.element.style.display = 'block';
	    },
	    reset: function () {
	        this.element.update('-------');
	        //this.element.style.display = 'none';	  
	    }
	};

	function showPhotos(urlsLeft, urlsCenter, urlsRight) {
	    console.log("showPhotos(...)");
	    assistant.provideUrl(viewer.mojo.leftUrlProvided,   urlsLeft);
		assistant.provideUrl(viewer.mojo.centerUrlProvided, urlsCenter);
		assistant.provideUrl(viewer.mojo.rightUrlProvided,  urlsRight);
	}

	function callAfterAcknowledgement(message, callback) {
	    button.style.display = 'block';
		Mojo.Event.listen(assistant.controller.get("continueButton"), Mojo.Event.tap, function (event) {
			console.log("BUTTON PRESSED");
			callback();
			button.style.display = 'none';
		}.bindAsEventListener(assistant));
		//TODO: stop listening
	    console.log(message);
	}

	// This function will popup a dialog, displaying the message passed in.
	function showDialogBox(title, message) {
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
	}

	console.log("&&& about to create Photos object ...");

	/** The main model for the app.
	 @type Photos */
	this.photos = new Photos(this.status, info, showDialogBox, showPhotos, callAfterAcknowledgement);

	console.log("&&& photos=" + this.photos);


	console.log("=== photos=" + this.photos);
	prevTime = 0;

	function now() {
	    var d = new Date();
		return d.getTime();
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
		    latLon = new LatLon(response.latitude, response.longitude);

		    /* throttle the calls to Flickr */
		    if ((now() - prevTime) < 60000 /*Mojo.Controller.appInfo.periodMillisec*/) {
			    return;  /* too soon */
			}
			prevTime = now();

            console.log("*** photos=" + assistant.photos);
			assistant.photos.fetch(latLon);
		},
	    onFailure: function (response) {
		    showDialogBox("Problem calling Flickr", response);
		}
	});
};

FirstAssistant.prototype.deactivate = function (event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
};

/** Stop listening to the ImageViewer widget */
FirstAssistant.prototype.cleanup = function (event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
	Mojo.Event.stopListening(this.controller.get('ImageId'), Mojo.Event.imageViewChanged, this.imageViewChanged);
};

