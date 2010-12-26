/* -*- tab-width:4 -*- */

/*
 * Copyright (c) 2010 Eamonn O'Brien-Strain, eob@well.com
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which is available at http://www.eclipse.org/legal/epl-v10.html
 */

/*jslint devel: true */
/* declare globals to keep JSLint happy */
var Mojo, setInterval; //framework

/** Keep track of user activity so that function can be executed when there is no activity 
@class A function to be executed whenever there is a period of inactivity greater than delay milliseconds. */
function Inactivity(delay) {
	var self = this;

	setInterval(function () {
		var now, func;
		now =  new Date().getTime();
		if (self.func !== null && now > Inactivity.lastActivity + delay) {
			func = self.func;
			Mojo.requireFunction(func);
			self.func = null;
			console.log("lastActivity         = " + Inactivity.lastActivity);
			console.log("lastActivity + delay = " + (Inactivity.lastActivity + delay));
			console.log("now                  = " + now);
			console.log("Executing " + func);
			func();
		} else {
			if (self.func !== null) {
				console.log("Not executing " + self.func);
			}
		}
	}, delay / 2);

	this.waitingFunc = null;

	/** Execute function when there has been no user activity recently */
	this.execWhenInactive = function (func) {
		Mojo.requireFunction(func);
		this.func = func;
	};

}

/** When was the last user activity */
Inactivity.lastActivity = new Date().getTime();

/** Class function to tell all instances of this class that user activity has happened */
Inactivity.userActivity = function () {
	Inactivity.lastActivity = new Date().getTime();
};


