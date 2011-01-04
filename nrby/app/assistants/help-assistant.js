/* -*- tab-width:4 -*- */

/*
 * Copyright (c) 2010 Eamonn O'Brien-Strain, eob@well.com
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which is available at http://www.eclipse.org/legal/epl-v10.html
 */

/*jslint devel: true */

/* declare globals to keep JSLint happy */
var Mojo, $L, $;
var StageAssistant;
var Inactivity;  //models

/** @class The controller for a page of help text.

@constructor this is the creator
function for your scene assistant object. It will be passed all the
additional parameters (after the scene name) that were passed to
pushScene. The reference to the scene controller (this.controller) has
not be established yet, so any initialization that needs the scene
controller should be done in the setup function below. */
function HelpAssistant() {


	/** Setup widgets */
	this.setup = function () {
		Inactivity.userActivity();
		
		/* use Mojo.View.render to render view templates and add them to the scene, if needed */
	
		/* setup widgets here */
		this.controller.setupWidget(Mojo.Menu.appMenu, StageAssistant.appMenuAttributes, StageAssistant.appMenuModel);
	
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

		$('releaseWebsite').setAttribute(
			'href',
			"http://nrby.eamonn.org/" + Mojo.Controller.appInfo.version + "-release.html");

		/* add event handlers to listen to events from widgets */

	};

	/** Respond to event from the back button */
	this.handleCommand = function (event) {
		Inactivity.userActivity();
		if (event.type === Mojo.Event.command) {
			if (event.command === 'do-back') {
				Mojo.Controller.stageController.popScene();		
			}
		}
	};

	/** Do nothing except note activity. */
	this.activate = function (event) {
		Inactivity.userActivity();
	};
	
	/** Do nothing except note activity. */
	this.deactivate = function (event) {
		Inactivity.userActivity();
	};
	
	/** Do nothing except note activity. */
	this.cleanup = function (event) {
		Inactivity.userActivity();
	};

}
