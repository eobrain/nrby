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
var StageAssistant; //controllers
var Photos, LatLon, Inactivity;  //models

/** @class The controller for the main photo-display scene. */
function FirstAssistant() {

	//Private fields
	var self, imageViewChanged, tapListener, isFullScreen, commandMenuModel, activateDone, status, photos;

	self = this;

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

	commandMenuModel = {
		visible: false,
		items: [
			{ iconPath: "images/menu-icon-fullscreen.png", command: "do-fullscreen" },
			{ icon: "info", command: "do-props" } 
		]
	};

	function setFullscreen(v) {
		commandMenuModel.visible = !v;
		self.controller.modelChanged(commandMenuModel);
		isFullScreen = v;
		self.controller.enableFullScreenMode(isFullScreen);
	}
		


	/** pass the two URLs as arguments to the provided function */
	function provideUrl(provided, urls) {
		provided(urls[1], urls[0]);
	}

		
	function goLeft() {
		photos.moveLeft();
		provideUrl($('ImageId').mojo.leftUrlProvided, photos.urlsLeft());
	}
	
	function goRight() {
		photos.moveRight();
		provideUrl($('ImageId').mojo.rightUrlProvided, photos.urlsRight());
	}
		

	function showPhotos(urlsLeft, urlsCenter, urlsRight) {
		var viewerMojo = $('ImageId').mojo;
		provideUrl(viewerMojo.leftUrlProvided,   urlsLeft);
		provideUrl(viewerMojo.centerUrlProvided, urlsCenter);
		provideUrl(viewerMojo.rightUrlProvided,  urlsRight);
	}
	
	// This function will popup a dialog, displaying the message passed in.
	function showDialogBox(titleStr, message) {
		Mojo.Log.error("ERROR REPORTED TO USER", titleStr, message);
		self.controller.showAlertDialog({
			onChoose: function (value) {},
			title: titleStr,
			message: message,
			choices: [
				{label: 'OK', value: ''}
			]
		});
	}
	



	// END Private methods, variables, and code
	/////////////////////////////////////////////
	// Begin public methods

	/** Handle the event of the user rotating the device, resizing the image viewer accordingly. */
	this.orientationChanged = function (orientation) {
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
		
	};

	/** Setup the ImageViewer widget and various callback functions to be sent to the model. */
	this.setup = function () {
		Inactivity.userActivity();
		
		var viewerModel, 
		appCtl, ctl;


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
		
		this.controller.setupWidget('ImageId',             {},                               viewerModel);
		this.controller.setupWidget(Mojo.Menu.appMenu,     StageAssistant.appMenuAttributes, StageAssistant.appMenuModel);
		this.controller.setupWidget(Mojo.Menu.commandMenu, {menuClass: 'no-fade'},           commandMenuModel);
			
		appCtl = Mojo.Controller.getAppController();
		
		/** callback function used to respond to new photo being
		displayed by ImageViewer */
		imageViewChanged = function (event) {
			this.orientationChanged(appCtl.getScreenOrientation());
			status.reset();
		}.bindAsEventListener(this);
		
		
		/** callback function used to respond to tap */
		tapListener = function (event) {
			Inactivity.userActivity();
			setFullscreen(false);
		}.bindAsEventListener(this);
		
		
		Mojo.Event.listen($('ImageId'), Mojo.Event.imageViewChanged, imageViewChanged);
		Mojo.Event.listen($('ImageId'), Mojo.Event.tap,              tapListener);
		
		setFullscreen(false);

		/** A display area used for brief status messages. */
		status = {
			element: $('nrbyStatus'),
			set: function (message) {
				Mojo.Log.info("MESSAGE TO USER: ", message);
				status.element.update(message);
				status.element.style.display = 'block';
			},
			reset: function () {
				status.element.update('-------');
				status.element.style.display = 'none';	  
			}
		};


		/** The main model for the app.  
            @type Photos */
		photos = new Photos();
		
		
	}; //setup

	
	/** Handle events from buttons on bottom of screen */
	this.handleCommand = function (event) {
		Inactivity.userActivity();
		if (event.type === Mojo.Event.command) {
			switch (event.command) {
			case 'do-props':
				Mojo.Controller.stageController.pushScene('photoinfo', photos, goLeft, goRight);
				break;
			case 'do-fullscreen':
				setFullscreen(true);
				break;
			}
		}
	};
		
	/** Create the Photos model object, and start listening for GPS location events. */
	this.activate = function (event, fullscreen) {
		Inactivity.userActivity();
		var prevTime; 
		

		setFullscreen(fullscreen === true);

		photos.setFeedback({
			status:     status,
			alertUser:  showDialogBox,
			showPhotos: showPhotos
		});
		
		if (activateDone === true) {
			return;
		}
		
		
		photos.fillWithInitData();

		/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */
		
		
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
					Mojo.Log.warn("GPS RETURNED ZEROS FOR LAT/LON ", response);
					return;
				}
				latLon = new LatLon(response.latitude, response.longitude);
				
				/* throttle the calls to Flickr */
				if ((now() - prevTime) < 10000 /*Mojo.Controller.appInfo.periodMillisec*/) {
					return;  /* too soon */
				}
				prevTime = now();
				
				photos.fetch(latLon);
			},
			onFailure: function (response) {
				showDialogBox("Problem using GPS", response);
			}
		});

		activateDone = true;
		
	};

	/** do nothing except note activity */
	this.deactivate = function (event) {
		//TODO: stop listening for GPS events?
		Inactivity.userActivity();
	};
	
	/** Stop listening to events */
	this.cleanup = function (event) {
		Inactivity.userActivity();
		Mojo.Event.stopListening($('ImageId'), Mojo.Event.imageViewChanged, imageViewChanged);
		Mojo.Event.stopListening($('ImageId'), Mojo.Event.tap,              tapListener);
	};
	
}