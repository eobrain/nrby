/* -*- tab-width:4 -*- */

/*
 * Copyright (c) 2010 Eamonn O'Brien-Strain, eob@well.com
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which is available at http://www.eclipse.org/legal/epl-v10.html
 */

/*jslint devel: true */

/* declare globals to keep JSLint happy */
var Mojo, $L;
var StageAssistant;
var Inactivity;  //models

function HelpAssistant() {
	/* this is the creator function for your scene assistant object. It will be passed all the 
	   additional parameters (after the scene name) that were passed to pushScene. The reference
	   to the scene controller (this.controller) has not be established yet, so any initialization
	   that needs the scene controller should be done in the setup function below. */
}

HelpAssistant.prototype.setup = function () {
	Inactivity.userActivity();
	/* this function is for setup tasks that have to happen when the scene is first created */
		
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

	/* add event handlers to listen to events from widgets */

	this.handleCommand = function (event) {
		Inactivity.userActivity();
		if (event.type === Mojo.Event.command) {
			if (event.command === 'do-back') {
				Mojo.Controller.stageController.popScene();		
			}
		}
    };

	/*if (HelpAssistant.dialogShown !== true) {
		this.controller.showAlertDialog({
			onChoose: function (value) {
				Inactivity.userActivity();
			},
			title: $L("Help"),
			message: $L("Do back gesture below screen to go back."),
			choices: [
				{label: $L("OK"), value: "cancel", type: 'dismiss'}    
			]
		});
		HelpAssistant.dialogShown = true;
	}*/

};

HelpAssistant.prototype.activate = function (event) {
	Inactivity.userActivity();
	/* put in event handlers here that should only be in effect when this scene is active. For
	   example, key handlers that are observing the document */
};

HelpAssistant.prototype.deactivate = function (event) {
	/* remove any event handlers you added in activate and do any other cleanup that should happen before
	   this scene is popped or another scene is pushed on top */
};

HelpAssistant.prototype.cleanup = function (event) {
	/* this function should do any cleanup needed before the scene is destroyed as 
	   a result of being popped off the scene stack */
};
