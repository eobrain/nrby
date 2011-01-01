/* -*- tab-width:4 -*- */

/*
 * Copyright (c) 2010 Eamonn O'Brien-Strain, eob@well.com
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which is available at http://www.eclipse.org/legal/epl-v10.html
 */

/*jslint devel: true */

function NrbyPreferences() {
	var recently, recentlyHook;

	recently = false;
	recentlyHook = function (v) {};

	this.getRecently = function () {
		return recently;
	};

	this.setRecently = function (v) {
		recently = v;
		recentlyHook(recently);
	};

	this.setRecentlyHook = function (f) {
		recentlyHook = f;
	};
}

var nrbyPreferences = new NrbyPreferences();
