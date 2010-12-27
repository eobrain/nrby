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
	var self = this;

	this.viewer = $('ImageId');

	HTMLElement.prototype.animateOpacity = function (handleOpacity) {
		if (self.opacityAnimation) {
			self.opacityAnimation.cancel();
		}
		self.opacityAnimation = 
		Mojo.Animation.animateValue(Mojo.Animation.queueForElement(self),
									'linear', 
									function (v) {
										handleOpacity((100 - v) / 100.0);
									},
	                                {from: 0, to: 100, duration: 10 }
									);
	};


	HTMLElement.prototype.fadeAway = function () {
		self.animateOpacity(function (opacity) {
			self.style.opacity = opacity;
		});
	};

	HTMLElement.prototype.fadeAwayText = function () {
		self.animateOpacity(function (opacity) {
			self.style.color = "rgba(255,255,255," + opacity + ")";
		});
	};


}

/** Handle the event of the user rotating the device, resizing the image viewer accordingly. */
FirstAssistant.prototype.orientationChanged = function (orientation) {
    var size, button;

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

    var self, viewerModel, wallpaperButtonModel,
	appCtl, ctl;


	self = this; //for use in functions

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
		self.photos.moveLeft();
		self.provideUrl(self.viewer.mojo.leftUrlProvided, self.photos.urlsLeft());
	}

	function goRight() {
		self.photos.moveRight();
		self.provideUrl(self.viewer.mojo.rightUrlProvided, self.photos.urlsRight());
	}

	viewerModel = {
		background: 'black',  
		onLeftFunction : function (event) {
			Inactivity.userActivity();
			goLeft();
	    },
		onRightFunction : function (event) {
			Inactivity.userActivity();
			goRight();
	    }
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
		this.status.reset();
	}.bindAsEventListener(this);


	this.pushSceneListener = function (event) {
		Inactivity.userActivity();
		Mojo.Controller.stageController.pushScene('photoinfo', this.photos, goLeft, goRight);
	}.bindAsEventListener(this);	

	Mojo.Event.listen(this.viewer, Mojo.Event.imageViewChanged, this.imageViewChanged);
	Mojo.Event.listen(this.viewer, Mojo.Event.tap, this.pushSceneListener);

	this.controller.showAlertDialog({
		onChoose: function (value) {
			Inactivity.userActivity();
		},
		title: $L("How To use This App"),
		message: $L("Flick sideways to change photos.  Pinch out to zoom.  Tap to see information."),
		choices: [
			{label: $L("OK"), value: "cancel", type: 'dismiss'}    
		]
	});

}; //setup


/** Create the Photos model object, and start listening for GPS location events. */
FirstAssistant.prototype.activate = function (event) {
	Inactivity.userActivity();
    var self, prevTime, 
	    wallpaperButton, wallpaperButtonText;

	console.log(">>> BEGIN first.activate -- this.activateDone=" + this.activateDone);

	if (this.activateDone === true) {
	    console.log(">>> Not doing setup because already setup");
		return;
	}


	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */

    wallpaperButton = $('wallpaperButton');
	wallpaperButtonText = wallpaperButton.getElementsBySelector('.truncating-text')[0];
	self = this; //for use in functions

	function showPhotos(urlsLeft, urlsCenter, urlsRight) {
	    self.provideUrl(self.viewer.mojo.leftUrlProvided,   urlsLeft);
		self.provideUrl(self.viewer.mojo.centerUrlProvided, urlsCenter);
		self.provideUrl(self.viewer.mojo.rightUrlProvided,  urlsRight);
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

			self.photos.fetch(latLon);
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
	Mojo.Event.stopListening(this.viewer, Mojo.Event.imageViewChanged, this.imageViewChanged);
	Mojo.Event.stopListening(this.viewer, Mojo.Event.tap, this.pushSceneListener);
};



