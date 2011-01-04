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
provides controls for a particular photo. 

@constructor this is the creator function for your scene assistant
object. It will be passed all the additional parameters (after the
scene name) that were passed to pushScene. The reference to the scene
controller (this.controller) has not be established yet, so any
initialization that needs the scene controller should be done in the
setup function below.  */
function PhotoinfoAssistant(photos, goLeft, goRight) {
	var self, flickListener, popHandler, mapHandler;
	
	self = this;

	function repaint() {
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
			$('license').update(license.name);
		}
		photos.refreshPhotoView();
	}

	flickListener = function (event) {
		Inactivity.userActivity();
		if (event.velocity.x < 0) {
			goRight();
		} else {
			goLeft();
		}
		repaint();
	}.bindAsEventListener(this);


	function openMap() {
		var photo, photoLatLon, mapQuery, loc;
		photo = photos.center();
		photoLatLon = new LatLon(photo.latitude, photo.longitude);
		Inactivity.userActivity();
		mapQuery =  photoLatLon.queryString() + '(' + photo.title + ')';
		loc = photoLatLon.gmapLocation();
		loc.age = 10;
		if (photos.latLon) {
			loc.acc = photos.latLon.metersFrom(photoLatLon);
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
	}

	// END PRIVATE VARIABLES AND METHODS 
	////////////////////////
    // BEGIN PUBLIC METHODS


	/** Setup widgets and event handlers */
	this.setup = function () {
		Inactivity.userActivity();
		

		/* use Mojo.View.render to render view templates and add them to the scene, if needed */
	
		/* setup widgets here */
		
		this.controller.setupWidget(Mojo.Menu.appMenu, StageAssistant.appMenuAttributes, StageAssistant.appMenuModel);
		this.controller.setupWidget(
			Mojo.Menu.commandMenu,
			{menuClass: 'no-fade'},
			{
				visible: true,
				items: [ 
					{ label: "Back", icon: "back", command: "do-back" },
					{ label: "Flickr", iconPath: 'images/flickr.png', command: "do-flickr" }
				]
			}
		); 

		popHandler = function (event) {
			Inactivity.userActivity();
			Mojo.Controller.stageController.popScene(event, true);		
		}.bindAsEventListener(this);

		/* add event handlers to listen to events from widgets */
		Mojo.Event.listen($('infoThumb'), Mojo.Event.tap, popHandler);

		mapHandler =  function (event) {
			openMap();
		}.bindAsEventListener(this);
		
		Mojo.Event.listen($('infoMap'), Mojo.Event.hold, mapHandler);
		


		Mojo.Event.listen($('infoBody'),      Mojo.Event.flick, flickListener);

		repaint();
	};

	/** Handle commands from buttons along bottom of screen */
	this.handleCommand = function (event) {
		Inactivity.userActivity();
		if (event.type === Mojo.Event.command) {
			switch (event.command) {
			case 'do-back':
				Mojo.Controller.stageController.popScene(event, false);		
				break;
			case 'do-flickr':
				Mojo.Controller.stageController.pushScene('webpage', photos.center());
				break;
			case 'do-map':
				openMap();
				break;
			}
		}
    };
	
	/** Do nothing, except note activity */
	this.activate = function (event) {
		Inactivity.userActivity();
	};
	
	/** Do nothing, except note activity */
	this.deactivate = function (event) {
		Inactivity.userActivity();
	};
	
	/** stop listening to events */
	this.cleanup = function (event) {
		Inactivity.userActivity();
		Mojo.Event.stopListening($('infoBody'),  Mojo.Event.flick, flickListener);
		Mojo.Event.stopListening($('infoThumb'), Mojo.Event.tap,   popHandler);
		Mojo.Event.stopListening($('infoMap'),   Mojo.Event.hold,  mapHandler);
	};

}
