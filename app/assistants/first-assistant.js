/* -*- tab-width:4 -*- */

/*
 * Copyright (c) 2010 Eamonn O'Brien-Strain, eob@well.com
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which is available at http://www.eclipse.org/legal/epl-v10.html
 */

/* declare globals to keep JSLint happy */
var Ajax, Mojo;

function FirstAssistant() {
	/* this is the creator function for your scene assistant object. It will be passed all the 
	   additional parameters (after the scene name) that were passed to pushScene. The reference
	   to the scene controller (this.controller) has not be established yet, so any initialization
	   that needs the scene controller should be done in the setup function below. */
}

FirstAssistant.prototype.setup = function () {
	/* this function is for setup tasks that have to happen when the scene is first created */
		
	/* use Mojo.View.render to render view templates and add them to the scene, if needed */
	
	/* setup widgets here */
    var ctl = this.controller;
    ctl.serviceRequest('palm://com.palm.location', {
	    method : 'getCurrentPosition',
		parameters: { responseTime: 2, subscribe: false },
		onSuccess: function (response) {
		    var url, req;
			ctl.get("latlon").update(response.latitude + "," + response.longitude);
			url = 'http://api.flickr.com/services/rest/?method=flickr.places.findByLatLon&api_key=' + Mojo.Controller.appInfo.flickrApiKey + '&lat=' + response.latitude + '&lon=' + response.longitude + '&format=json&nojsoncallback=1';
//url = 'http://api.flickr.com/services/rest/?method=flickr.places.findByLatLon&api_key=bfc079074ce06c81a8fcab2f4d320a43&lat=' + response.latitude + '&lon=' + response.longitude + '&format=json&nojsoncallback=1';
			ctl.get("place").update("Getting response from Flickr ...");
			req = new Ajax.Request(url, {
			    method: 'get',
				onSuccess: function (transport) {
				    var response = Mojo.parseJSON(transport.responseText);
					if (response.stat !== "ok") {
					    ctl.get("place").update("Error from Flickr " + transport.responseText);
					} else {
					    ctl.get("place").update(response.places.place[0].name);
					}
				},
				onFailure: function () {
				    ctl.get("place").update('Problem connecting to Flickr');
				}
			});

		},
	    onFailure: function (response) {
		    ctl.get("latlon").update("Error getting GPS info: " + response);
		}
	});

	/* add event handlers to listen to events from widgets */
};

FirstAssistant.prototype.activate = function (event) {
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */
};

FirstAssistant.prototype.deactivate = function (event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
};

FirstAssistant.prototype.cleanup = function (event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
};
