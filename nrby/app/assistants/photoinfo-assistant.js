/* -*- tab-width:4 -*- */

/*
 * Copyright (c) 2010 Eamonn O'Brien-Strain, eob@well.com
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which is available at http://www.eclipse.org/legal/epl-v10.html
 */

/*jslint devel: true */

/* declare globals to keep JSLint happy */
var Mojo, $; //framework

/** @class The controller for the scene that shows information and
provides controls for a particular photo. */
function PhotoinfoAssistant(photo) {
	/* this is the creator function for your scene assistant object. It will be passed all the 
	   additional parameters (after the scene name) that were passed to pushScene. The reference
	   to the scene controller (this.controller) has not be established yet, so any initialization
	   that needs the scene controller should be done in the setup function below. */
	console.log("PhotoInfoAssistant(" + photo.title + ")");
	this.photo = photo;
	$('infoTitle').update(photo.title);
	$('infoThumb').setAttribute('src', photo.url_t);
}

PhotoinfoAssistant.prototype.setup = function () {
	var self, gotoPhotoPage;

	self = this;

	/* this function is for setup tasks that have to happen when the scene is first created */
		
	/* use Mojo.View.render to render view templates and add them to the scene, if needed */
	
	/* setup widgets here */
	this.controller.setupWidget('gotoPhotoPage', {}, {label : "View on Flickr"});

	gotoPhotoPage = function (event) {
		console.log("GOTO PHOTO PAGE BUTTON PRESSED");
		self.controller.serviceRequest("palm://com.palm.applicationManager", {
			method: "open",
			parameters:  {
				id: 'com.palm.app.browser',
				params: {
					target: self.photo.photoPage()
				}
			}
		}); 
		
	}.bindAsEventListener(this);	
	
	
	/* add event handlers to listen to events from widgets */
	Mojo.Event.listen($('gotoPhotoPage'), Mojo.Event.tap, gotoPhotoPage);
};

PhotoinfoAssistant.prototype.activate = function (event) {
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */
};

PhotoinfoAssistant.prototype.deactivate = function (event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
};

PhotoinfoAssistant.prototype.cleanup = function (event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
};
