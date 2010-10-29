/* -*- tab-width:4 -*- */

/*
 * Copyright (c) 2010 Eamonn O'Brien-Strain, eob@well.com
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which is available at http://www.eclipse.org/legal/epl-v10.html
 */

/*jslint devel: true */

/* declare globals to keep JSLint happy */
var Mojo, $, window, HTMLElement; //framework
var Photos, LatLon;  //models

/** @class The controller for the one and only scene in this app. */
function FirstAssistant() {

	HTMLElement.prototype.animateOpacity = function (handleOpacity) {
		if (this.opacityAnimation) {
			this.opacityAnimation.cancel();
		}
		this.opacityAnimation = 
		Mojo.Animation.animateValue(Mojo.Animation.queueForElement(this),
									'linear', 
									function (v) {
										//console.log("Calling handleOpacity(" + ((100 - v) / 100.0) + ")");
										handleOpacity((100 - v) / 100.0);
									},
	                                {from: 0, to: 100, duration: 10 }
									);
	};


	HTMLElement.prototype.fadeAway = function () {
		var self = this;
		this.animateOpacity(function (opacity) {
				self.style.opacity = opacity;
			});
	};

	HTMLElement.prototype.fadeAwayText = function () {
		var self = this;
		this.animateOpacity(function (opacity) {
				self.style.color = "rgba(255,255,255," + opacity + ")";
			});
	};


}

/** Handle the event of the user rotating the device, resizing the image viewer accordingly. */
FirstAssistant.prototype.orientationChanged = function (orientation) {
    var size, viewer, button;
    // you will be passed "left", "right", "up", or "down" (and maybe others?)
    //console.log("orientationChanged(" + orientation + ")");
	switch (orientation) {
	case "up":   //normal portrait
	case "down": //reverse portrait
	    size = [Mojo.Environment.DeviceInfo.screenWidth, Mojo.Environment.DeviceInfo.screenHeight];
		break;
	case "left":  //left side down
	case "right": //right side down
		size = [Mojo.Environment.DeviceInfo.screenHeight, Mojo.Environment.DeviceInfo.screenWidth];
		break;
	default:
		//do nothing
		return;
	}

	//Make viewer fill the screen
	$('ImageId').mojo.manualSize(size[0], size[1]);

	//Move status and button to bottom
	$('nrbyStatus').style.top     = (size[1] - 60) + "px";
	$('refreshButton').style.top = (size[1] - 60) + "px";
	$('wallpaperButton').style.top = (size[1] - 60) + "px";
};

/** Setup the ImageViewer widget and various callback functions to be sent to the model. */
FirstAssistant.prototype.setup = function () {
    var assistant, viewerModel, refreshButtonModel, wallpaperButtonModel,
	viewer, appCtl, ctl, refreshButton;

	viewer = $('ImageId');
    refreshButton   = $('refreshButton');

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
	    provided(urls[1], urls[0]);
	};

	viewerModel = {
		background: 'black',  
		onLeftFunction : function (event) {
			var refreshButtonText;
			refreshButtonText   = refreshButton.getElementsBySelector('.truncating-text')[0];
		    assistant.photos.moveLeft();
		    assistant.provideUrl(viewer.mojo.leftUrlProvided, assistant.photos.urlsLeft());
			assistant.photos.showInfo();
			refreshButton.fadeAway();
			refreshButtonText.fadeAwayText();
	    }.bind(this),
		onRightFunction : function (event) {
			var refreshButtonText;
			refreshButtonText   = refreshButton.getElementsBySelector('.truncating-text')[0];
		    assistant.photos.moveRight();
		    assistant.provideUrl(viewer.mojo.rightUrlProvided, assistant.photos.urlsRight());
			assistant.photos.showInfo();
			refreshButton.fadeAway();
			refreshButtonText.fadeAwayText();
	    }.bind(this)
	};

    refreshButtonModel = {
	    label : "Refresh",
	    disabled: false
	};

    wallpaperButtonModel = {
	    label : "Set as Wallpaper",
	    disabled: false
	};

	this.controller.setupWidget('ImageId', {}, viewerModel);
	this.controller.setupWidget("refreshButton", {}, refreshButtonModel);
	this.controller.setupWidget("wallpaperButton", {}, wallpaperButtonModel);

    appCtl = Mojo.Controller.getAppController();

	/** callback function used to respond to new photo being displayed by ImageViewer */
    this.imageViewChanged = function (event) {
	    //console.log(" ====== imageViewChanged(" + event + ")");
	    FirstAssistant.prototype.orientationChanged(appCtl.getScreenOrientation());
		assistant.status.reset();
	}.bindAsEventListener(this);

	Mojo.Event.listen(this.controller.get('ImageId'), Mojo.Event.imageViewChanged, this.imageViewChanged);
}; //setup


/** Create the Photos model object, and start listening for GPS location events. */
FirstAssistant.prototype.activate = function (event) {
    var assistant, prevTime, viewer, info,
	    refreshButton, refreshButtonText, wallpaperButton, wallpaperButtonText;
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */

	viewer = $('ImageId');
    refreshButton   = $('refreshButton');
    wallpaperButton = $('wallpaperButton');
	refreshButtonText   = refreshButton.getElementsBySelector('.truncating-text')[0];
	wallpaperButtonText = wallpaperButton.getElementsBySelector('.truncating-text')[0];
	assistant = this; //for use in lambda functions

	info = {
	    element: $('nrbyInfoLink'),
		set: function (message, url) {
	        this.element.update(message);
			this.element.setAttribute('href', url);
			//console.log(">>>> nrbyInfoLink.constructor=" + (this.element.constructor));
			$('nrbyInfo').fadeAway();
			this.element.fadeAwayText();
	        //this.element.style.display = 'block';
	    },
	    reset: function () {
	        this.element.update('-------');
	        //this.element.style.display = 'none';	  
	    }
	};

	function showPhotos(urlsLeft, urlsCenter, urlsRight) {
	    assistant.provideUrl(viewer.mojo.leftUrlProvided,   urlsLeft);
		assistant.provideUrl(viewer.mojo.centerUrlProvided, urlsCenter);
		assistant.provideUrl(viewer.mojo.rightUrlProvided,  urlsRight);
	}

	this.stopListeningToRefreshButton = function () { /* do nothing*/ };
	this.stopListeningToWallpaperButton = function () { /* do nothing*/ };

	function callAfterAcknowledgement(message, callback) {
	    var listener;
		console.log("callAfterAcknowledgement(\"" + message + "\",)");
	    refreshButton.style.display = 'block';
		refreshButton.fadeAway();
		refreshButtonText.fadeAwayText();
		assistant.stopListeningToRefreshButton(); //clear any previous listeners

		listener = function (event) {
			console.log("BUTTON PRESSED");
			callback();
			refreshButton.style.display = 'none';
		}.bindAsEventListener(assistant);	

		refreshButton = assistant.controller.get("refreshButton");

		Mojo.Event.listen(refreshButton, Mojo.Event.tap, listener);
		
		assistant.stopListeningToRefreshButton = function () {
		    Mojo.Event.stopListening(refreshButton, Mojo.Event.tap, listener);
		};

	    console.log(message);
	}

	// This function will popup a dialog, displaying the message passed in.
	function showDialogBox(titleStr, message) {
		console.log("\n" + 
					"********************\n" +
					"* " + titleStr + "\n" +
					"********************\n" + 
					"* " + message + "\n" +
					"********************\n");
		this.controller.showAlertDialog({
			onChoose: function (value) {},
			title: titleStr,
			message: message,
			choices: [ {label: 'OK', value: 'OK', type: 'color'} ]
		});
	}


	/** The main model for the app.
	 @type Photos */
	this.photos = new Photos(this.status, info, showDialogBox, showPhotos, callAfterAcknowledgement);

	//console.log("=== photos=" + this.photos);
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
		    if ((now() - prevTime) < 10000 /*Mojo.Controller.appInfo.periodMillisec*/) {
			    return;  /* too soon */
			}
			prevTime = now();

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
    this.stopListeningToRefreshButton(); //clear any previous listeners
    this.stopListeningToWallpaperButton(); //clear any previous listeners
};

/** Stop listening to the ImageViewer widget */
FirstAssistant.prototype.cleanup = function (event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
	Mojo.Event.stopListening(this.controller.get('ImageId'), Mojo.Event.imageViewChanged, this.imageViewChanged);
};



