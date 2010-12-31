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
var Inactivity, nrbyPreferences;	 //models

/** @class The only stage in this app (containing a single scene). */
function StageAssistant() {
}

/** push the first scene and allow app to respond to window orientation events */
StageAssistant.prototype.setup = function () {
    /* this function is for setup tasks that have to happen when the stage is first created */

    this.controller.pushScene("first");

	/* allow rotation */
	if (this.controller.setWindowOrientation) {
	    this.controller.setWindowOrientation("free");
	}

};

StageAssistant.prototype.appMenuModel = {
	items: [
		
		{label: "About Nrby Photos...", command: 'do-nrbyAbout', shortcut: 'a'},
		{label: "Preferences ...", items: [
			{label: "Get Recent Photos", command: 'do-recently'}
		]}
		//{label: "Preferences", command: 'do-appPrefs', shortcut: 'p'},
		//{label: "Help", command: 'do-appHelp', shortcut: 'h'}
	]
};

StageAssistant.prototype.handleCommand = function (event) {
	Inactivity.userActivity();
	if (event.type === Mojo.Event.commandEnable && 
		(event.command === Mojo.Menu.helpCmd /*|| event.command === Mojo.Menu.prefsCmd*/)) 
	{
		event.stopPropagation();
    }
    this.controller = Mojo.Controller.stageController.activeScene();
    if (event.type === Mojo.Event.command) {
		console.log("event.command=" + event.command);
        switch (event.command) {
        case 'do-recently':
			console.log("Chose Preferences ... Get Recent Photos menu item");
			StageAssistant.prototype.appMenuModel.items[1].items[0] = 
				{label: "Get Interesting Photos", command: 'do-interesting'};
			nrbyPreferences.recently = true;
			break;
        case 'do-recently':
			console.log("Chose Preferences ... Get Recent Photos menu item");
			StageAssistant.prototype.appMenuModel.items[1].items[0] = 
				{label: "Get Recent Photos", command: 'do-recently'};
			nrbyPreferences.recently = false;
			break;
        case 'do-nrbyAbout':
			console.log("Chose About menu item");
            this.controller.showAlertDialog({
                onChoose: function (value) {},
                title: "Nrby Photos " + Mojo.Controller.appInfo.version,
                message: $L("Copyright 2010, Eamonn O'Brien-Strain"),
                choices: [
                    {label: $L("OK"), value: ""}
                ]
            });
            break;
        case 'palm-help-cmd':
            //this.controller.pushScene("help");
			Mojo.Controller.stageController.pushScene("help", this);
            break;
			
        /*case 'palm-prefs-cmd':
            //this.controller.pushScene("prefs");
			Mojo.Controller.stageController.pushScene("prefs", this);
            break;*/
        }
    }
}; 
