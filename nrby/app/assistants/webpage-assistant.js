/* -*- tab-width:4 -*- */

/*
 * Copyright (c) 2010 Eamonn O'Brien-Strain, eob@well.com
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which is available at http://www.eclipse.org/legal/epl-v10.html
 */

/*jslint devel: true */

/* declare globals to keep JSLint happy */
var Mojo, $L; //framework
var StageAssistant; //other assistants
var Inactivity;  //models

/** @class View the web page for this photo on Flickr */
function WebpageAssistant(photo) {
	/* this is the creator function for your scene assistant object. It will be passed all the 
	   additional parameters (after the scene name) that were passed to pushScene. The reference
	   to the scene controller (this.controller) has not be established yet, so any initialization
	   that needs the scene controller should be done in the setup function below. */
	this.photo = photo;
}

WebpageAssistant.prototype.setup = function () {
	Inactivity.userActivity();

	/* this function is for setup tasks that have to happen when the scene is first created */
		
	/* use Mojo.View.render to render view templates and add them to the scene, if needed */
	
	/* setup widgets here */
	this.controller.setupWidget(
		"webpage",
		this.attributes = {
			url:	this.photo.photoPage()
		},
		this.model = {}
	);	
	this.controller.setupWidget(
		Mojo.Menu.commandMenu,
		this.commandMenuAttributes = {
			menuClass: 'no-fade'
		},
		this.commandMenuModel = {
			visible: true,
			items: [ 
				{ label: "Back", icon: "back", command: "do-back" }
			]
		}
	); 
	this.controller.setupWidget(Mojo.Menu.appMenu, StageAssistant.appMenuAttributes, StageAssistant.appMenuModel);
	/* add event handlers to listen to events from widgets */

	this.handleCommand = function (event) {
		Inactivity.userActivity();
		if (event.type === Mojo.Event.command) {
			if (event.command === 'do-back') {
				Mojo.Controller.stageController.popScene();		
			}
		}
    };

	/*if (WebpageAssistant.dialogShown !== true) {
		this.controller.showAlertDialog({
			onChoose: function (value) {
				Inactivity.userActivity();
			},
			title: $L("Photo on Flickr"),
			message: $L("Do back gesture below screen to go back."),
			choices: [
				{label: $L("OK"), value: "cancel", type: 'dismiss'}    
			]
		});
		WebpageAssistant.dialogShown = true;
	}*/
};

WebpageAssistant.prototype.activate = function (event) {
	Inactivity.userActivity();
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */
};

WebpageAssistant.prototype.deactivate = function (event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
};

WebpageAssistant.prototype.cleanup = function (event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
};
