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

StageAssistant.appMenuAttributes = {
    omitDefaultItems: true
};

StageAssistant.appMenuModel = {
	items: [
		Mojo.Menu.editItem,
		{label: "About Nrby Photos...", command: 'do-nrbyAbout', shortcut: 'b'},
		{label: "Preferences", items: [
			{label: "Sort Photos by", /*toggleCmd: 'do-interesting',*/ items: [
				{chosen: true, label: "How Interesting", command: 'do-interesting', shortcut: 'i'},
				{chosen: false, label: "How Recent",      command: 'do-recently',   shortcut: 'r'}
			]}
			/*{disabled: false, label: "Prefer Interesting Photos", command: 'do-interesting', shortcut: 'i'},
			{disabled: true,  label: "Prefer Recent Photos",      command: 'do-recently',   shortcut: 'r'}*/
		], command: 'do-appPrefs'},
		{label: "Help", command: 'do-help', shortcut: 'h'}
	]
};

/*StageAssistant.adjustAppMenu(){
	var recently = nrbyPreferences.getRecently();
	StageAssistant.appMenuModel.items[2].items[0].disabled = true;
	StageAssistant.appMenuModel.items[2].items[1].disabled = false;
}*/

StageAssistant.prototype.handleCommand = function (event) {
	Inactivity.userActivity();
	if (event.type === Mojo.Event.commandEnable && 
		(event.command === Mojo.Menu.helpCmd || event.command === Mojo.Menu.prefsCmd)) 
	{
		event.stopPropagation();
    }
    this.controller = Mojo.Controller.stageController.activeScene();
    if (event.type === Mojo.Event.command) {
        switch (event.command) {
        case 'do-recently':
			StageAssistant.appMenuModel.items[2].items[0].items[0].chosen = false;
			StageAssistant.appMenuModel.items[2].items[0].items[1].chosen = true;
			nrbyPreferences.setRecently(true);
			//StageAssistant.appMenuModel.items[2].toggleCmd = event.command;
			//this.controller.modelChanged(StageAssistant.appMenuModel);
			break;
        case 'do-interesting':
			StageAssistant.appMenuModel.items[2].items[0].items[0].chosen = true;
			StageAssistant.appMenuModel.items[2].items[0].items[1].chosen = false;
			nrbyPreferences.setRecently(false);
			//StageAssistant.appMenuModel.items[2].toggleCmd = event.command;
			//this.controller.modelChanged(StageAssistant.appMenuModel);
			break;
        case 'do-nrbyAbout':
            this.controller.showAlertDialog({
                onChoose: function (value) {},
                title: "Nrby Photos " + Mojo.Controller.appInfo.version,
                message: $L("Copyright 2010, Eamonn O'Brien-Strain"),
                choices: [
                    {label: $L("OK"), value: ""}
                ]
            });
            break;
        case 'do-help':
			Mojo.Controller.stageController.pushScene("help", this);
            break;	
		}
    }
}; 
