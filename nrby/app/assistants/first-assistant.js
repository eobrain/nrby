/* -*- tab-width:4 -*- */

/*
 * Copyright (c) 2010 Eamonn O'Brien-Strain, eob@well.com
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which is available at http://www.eclipse.org/legal/epl-v10.html
 */

/*jslint devel: true */

/* declare globals to keep JSLint happy */
var Mojo, $, $L, window, HTMLElement; //framework
var Photos, LatLon, Inactivity;  //models

/** @class The controller for the main photo-display scene. */
function FirstAssistant() {

	HTMLElement.prototype.animateOpacity = function (handleOpacity) {
		if (this.opacityAnimation) {
			this.opacityAnimation.cancel();
		}
		this.opacityAnimation = 
		Mojo.Animation.animateValue(Mojo.Animation.queueForElement(this),
									'linear', 
									function (v) {
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
	Inactivity.userActivity();

    var size, viewer, button;
    // you will be passed "left", "right", "up", or "down" (and maybe others?)
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
	$('wallpaperButton').style.top = (size[1] - 60) + "px";
};

/** Setup the ImageViewer widget and various callback functions to be sent to the model. */
FirstAssistant.prototype.setup = function () {
	Inactivity.userActivity();

    var assistant, viewerModel, wallpaperButtonModel,
	viewer, appCtl, ctl, pushSceneListener;

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
	    provided(urls[1], urls[0]);
	};

	function goLeft() {
		assistant.photos.moveLeft();
		assistant.provideUrl(viewer.mojo.leftUrlProvided, assistant.photos.urlsLeft());
	}

	function goRight() {
		assistant.photos.moveRight();
		assistant.provideUrl(viewer.mojo.rightUrlProvided, assistant.photos.urlsRight());
	}

	viewerModel = {
		background: 'black',  
		onLeftFunction : function (event) {
			Inactivity.userActivity();
			goLeft();
	    }.bind(this),
		onRightFunction : function (event) {
			Inactivity.userActivity();
			goRight();
	    }.bind(this)
	};

    wallpaperButtonModel = {
	    label : "Set as Wallpaper",
	    disabled: false
	};

	this.controller.setupWidget('ImageId', {}, viewerModel);
	this.controller.setupWidget("wallpaperButton", {}, wallpaperButtonModel);

    appCtl = Mojo.Controller.getAppController();

	/** callback function used to respond to new photo being displayed
	by ImageViewer */
    this.imageViewChanged = function (event) {
	    FirstAssistant.prototype.orientationChanged(appCtl.getScreenOrientation());
		assistant.status.reset();
	}.bindAsEventListener(this);


	pushSceneListener = function (event) {
		Inactivity.userActivity();
		Mojo.Controller.stageController.pushScene('photoinfo', assistant.photos, goLeft, goRight);
	}.bindAsEventListener(assistant);	

	Mojo.Event.listen(viewer, Mojo.Event.imageViewChanged, this.imageViewChanged);
	Mojo.Event.listen(viewer, Mojo.Event.hold, pushSceneListener);

	this.controller.showAlertDialog({
		onChoose: function (value) {
			Inactivity.userActivity();
		},
		title: $L("How To use This App"),
		message: $L("Flick sideways to change photos.  Double-tap to zoom.  Press-and-hold to see details about the photos."),
		choices: [
			{label: $L("OK"), value: "cancel", type: 'dismiss'}    
		]
	});

}; //setup


/** Create the Photos model object, and start listening for GPS location events. */
FirstAssistant.prototype.activate = function (event) {
	Inactivity.userActivity();
    var assistant, prevTime, viewer, //info,
	    wallpaperButton, wallpaperButtonText;

	console.log(">>> BEGIN first.activate -- this.activateDone=" + this.activateDone);

	if (this.activateDone === true) {
	    console.log(">>> Not doing setup because already setup");
		return;
	}


	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */

	viewer = $('ImageId');
    wallpaperButton = $('wallpaperButton');
	wallpaperButtonText = wallpaperButton.getElementsBySelector('.truncating-text')[0];
	assistant = this; //for use in lambda functions

	function showPhotos(urlsLeft, urlsCenter, urlsRight) {
	    assistant.provideUrl(viewer.mojo.leftUrlProvided,   urlsLeft);
		assistant.provideUrl(viewer.mojo.centerUrlProvided, urlsCenter);
		assistant.provideUrl(viewer.mojo.rightUrlProvided,  urlsRight);
	}

	this.stopListeningToWallpaperButton = function () { /* do nothing*/ };

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
	this.photos = new Photos(this.status, /*info,*/ showDialogBox, showPhotos/*, callAfterAcknowledgement*/);

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

	this.activateDone = true;
	console.log(">>> END   first.activate -- this.activateDone=" + this.activateDone);

};

FirstAssistant.prototype.deactivate = function (event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
    this.stopListeningToWallpaperButton(); //clear any previous listeners
};

/** Stop listening to the ImageViewer widget */
FirstAssistant.prototype.cleanup = function (event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
	Mojo.Event.stopListening(this.controller.get('ImageId'), Mojo.Event.imageViewChanged, this.imageViewChanged);
};



