/* -*- tab-width:4 -*- */

/*
 * Copyright (c) 2010 Eamonn O'Brien-Strain, eob@well.com
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which is available at http://www.eclipse.org/legal/epl-v10.html
 */

/*jslint devel: true */

/* declare globals to keep JSLint happy */
var Mojo, $, $L; //framework
var StageAssistant; //other assistants
var nrbyFlickrLicenses, Inactivity, LatLon;  //models;

/** @class The controller for the scene that shows information and
provides controls for a particular photo. */
function PhotoinfoAssistant(photos, goLeft, goRight) {
	/* this is the creator function for your scene assistant object. It will be passed all the 
	   additional parameters (after the scene name) that were passed to pushScene. The reference
	   to the scene controller (this.controller) has not be established yet, so any initialization
	   that needs the scene controller should be done in the setup function below. */

	var self = this;


	this.photos = photos;

	this.repaint = function () {
		var photo, photoLatLon, distance, direction, license, mapUrl, hereQuery, photoLatLonQuery;
		photo = photos.center();
		photoLatLon = new LatLon(photo.latitude, photo.longitude);
		photoLatLonQuery = photoLatLon.queryString();
		mapUrl = 'http://maps.google.com/maps/api/staticmap?size=300x200&language=' +
			Mojo.Locale.getCurrentLocale() + '&maptype=hybrid&markers=color:0xFF0000|' + photoLatLonQuery + '&sensor=true';
		if (photos.latLon) {
			distance  = photos.latLon.metersFrom(photoLatLon);
			direction = photos.latLon.directionTo(photoLatLon);
			$('where').update(distance.metersLocalized() + ' ' + direction);
			hereQuery = photos.latLon.queryString();
			mapUrl += '&center=' + hereQuery + '&path=color:0xFF0000|' + hereQuery + '|' + photoLatLonQuery;		
		}

		$('infoTitle').update(photo.title);
		$('infoThumb').setAttribute('src', photo.url_t);
		$('infoMap').setAttribute('src', mapUrl);
		$('author').update(photo.ownername);
		$('date').update(Mojo.Format.formatRelativeDate(photo.datetaken.parseFlickrDate(), "default"));
		license = nrbyFlickrLicenses[photo.license];
		if (license) {
			$('license').update('(' + license.name + ')');
		}
		photos.refreshPhotoView();
	};
	this.repaint();

	this.flickListener = function (event) {
		Inactivity.userActivity();
		if (event.velocity.x > 0) {
			console.log("FLICK RIGHT");
			goRight();
		} else {
			console.log("FLICK LEFT");
			goLeft();
		}
		self.repaint();
	}.bindAsEventListener(this);
}



PhotoinfoAssistant.prototype.setup = function () {
	Inactivity.userActivity();
	var self, controller;
	
	self = this;
    controller = this.controller;

	/* this function is for setup tasks that have to happen when the scene is first created */
		
	/* use Mojo.View.render to render view templates and add them to the scene, if needed */
	
	/* setup widgets here */
	//controller.setupWidget('gotoPhotoPage', {}, {label : "View on Flickr"});
	//controller.setupWidget('setWallpaper',  {}, {label : "Set As Wallpaper"});

	
	/*function downloadAndSetWallpaper(url) {

		console.log("DOWNLOADING " + url);
		controller.serviceRequest(
			'palm://com.palm.downloadmanager/', 
			{
				method: 'download', 
				parameters: {
					target: url,
					mime: "image/jpeg",
					targetDir : "/media/internal/downloads/",
					targetFilename : "nrbyWallpaper.jpg",
					keepFilenameOnRedirect: true,
					subscribe: false
				},
				onSuccess: function (resp) {
					console.log("DOWNLOADED " + Object.toJSON(resp));
					controller.serviceRequest(
						'palm://com.palm.systemservice/wallpaper', 
						{
							method: "importWallpaper",
							parameters: {
								target: "file:///media/internal/downloads/nrbyWallpaper.jpg"
							},
							onSuccess: function (returnValue, wallpaper) {
								console.log("IMPORTED WALLPAPER " + Object.toJSON(returnValue) + " " + Object.toJSON(wallpaper));
								
						
								controller.serviceRequest(
									'palm://com.palm.systemservice/', 
									{
										method: "setPreferences",
										parameters: {
											wallpaper: wallpaper
										},
										onSuccess: function () {
											console.log("set wallpaper");
										},
										onFailure: function (e) {
											console.log("FAILED setting wallpaper " + Object.toJSON(e));
										}
									});
								
							},
							onFailure: function (e) {
								console.log("FAILED IMPORTED WALLPAPER " + Object.toJSON(e));
							}
						});  
				},
				onFailure: function (e) { 
					console.log("FAILED DOWNLOADING " + Object.toJSON(e));
				}
			});
	}*/

	/*setWallpaper = function (event) {
		console.log("SET WALLPAPER BUTTON PRESSED");
		downloadAndSetWallpaper(self.photos.urlsCenter()[1]);
	}.bindAsEventListener(this);*/
		
	this.controller.setupWidget(Mojo.Menu.appMenu, StageAssistant.appMenuAttributes, StageAssistant.appMenuModel);

	/* add event handlers to listen to events from widgets */
	Mojo.Event.listen($('gotoPhotoPage'), Mojo.Event.tap, function (event) {
		Inactivity.userActivity();
		console.log("GOTO PHOTO PAGE TAPPED");
		Mojo.Controller.stageController.pushScene('webpage', this.photos.center());
	}.bindAsEventListener(this));
	Mojo.Event.listen($('infoMap'), Mojo.Event.tap, function (event) {
		var photo, photoLatLon, mapQuery, loc;
		photo = self.photos.center();
		photoLatLon = new LatLon(photo.latitude, photo.longitude);
		Inactivity.userActivity();
		console.log("GOTO MAP BUTTON PRESSED");
		mapQuery =  photoLatLon.queryString() + '(' + photo.title + ')';
		console.log("MAP QUERY >>>>>>> " + mapQuery);
		loc = photoLatLon.gmapLocation();
		loc.age = 10;
		if (self.photos.latLon) {
			loc.acc = self.photos.latLon.metersFrom(photoLatLon);
		} 
		self.controller.serviceRequest("palm://com.palm.applicationManager", {
			method: "open",
			parameters: {
				id: "com.palm.app.maps",
				params: {
					location: loc,
					query: mapQuery
				}
			}
		});
	}.bindAsEventListener(this));

	//Mojo.Event.listen($('setWallpaper'),     Mojo.Event.tap,   setWallpaper);
	Mojo.Event.listen($('infoBody'),      Mojo.Event.flick, this.flickListener);

	if (PhotoinfoAssistant.dialogShown !== true) {
		this.controller.showAlertDialog({
			onChoose: function (value) {
				Inactivity.userActivity();
			},
			title: $L("Photo Information"),
			message: $L("Tap photo to view on Flickr.  Tap map to bring up map app.  Use menu on top left for more.  Do back gesture below screen to go back."),
			choices: [
				{label: $L("OK"), value: "cancel", type: 'dismiss'}    
			]
		});
		PhotoinfoAssistant.dialogShown = true;
	}



};

PhotoinfoAssistant.prototype.activate = function (event) {
	Inactivity.userActivity();
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
