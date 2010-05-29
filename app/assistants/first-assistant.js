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
var Photos;                //models

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
    var assistant, viewer, appCtl, ctl;

	viewer = $('ImageId');

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

	ctl.enableFullScreenMode(true);

	this.provideUrl = function (provided, urls) {
	    console.log("provdeUrl");
	    provided(urls[1], urls[0]);
	};

	this.attributes = {
		//noExtractFS : true	//optional, turn off using extractfs to speed up renders.
	};
	this.model = {
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
    var assistant, prevTime, viewer, info;
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */

	console.log("activate(..)");
	viewer = $('ImageId');
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

	console.log("&&& about to create Photos object ...");
	assistant.photos = new Photos(assistant.status, info, assistant.showDialogBox, showPhotos);
	console.log("&&& photos=" + assistant.photos);


	console.log("=== photos=" + assistant.photos);
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
		    latLon = 'lat=' + response.latitude + '&lon=' + response.longitude;

		    /* throttle the calls to Flickr */
		    if ((now() - prevTime) < 60000 /*Mojo.Controller.appInfo.periodMillisec*/) {
			    return;  /* too soon */
			}
			prevTime = now();

		    console.log(latLon);
            console.log("*** photos=" + assistant.photos);
			assistant.photos.fetch(latLon);
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
