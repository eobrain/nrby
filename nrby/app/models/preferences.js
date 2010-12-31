/* -*- tab-width:4 -*- */

/*
 * Copyright (c) 2010 Eamonn O'Brien-Strain, eob@well.com
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which is available at http://www.eclipse.org/legal/epl-v10.html
 */

/*jslint devel: true */

var nrbyPreferences = {
	recently: false
};

console.log("RECENTLY INITIALIZED TO " + nrbyPreferences.recently);

/*var Mojo;

function NrbyPreferences() {
	var self = this;

	this.db = new Mojo.Depot(
		{
			name: "nrbyPhotos"
		}, 
		function () {
			console.log("Preference database created.");
		},
		function (error) {
			Mojo.log.error("Error creating preference database: " + error);
		}
	);

	this.get = function (key, dfault, callback) {
		self.db.get(
			key,
			function (value) {
				console.log("callback(" + value + " === null) ? " + dfault + " : " + value + ")");
				console.log("callback(" + ((value === null) ? dfault : value) + ")");
				callback((value === null) ? dfault : value);
			},
			function (error)	{
				Mojo.log.error("Error retrieving " + key + " from database: " + error);
			}
		);
	};

	this.put = function (key, value) {
		this.db.add(
			key,
			value,
			function () {
				console.log("Wrote preference" + key + " = " + value);
			},
			function (error) {
				Mojo.log.error("Error writing to preference database: " + error);
			}
		);
	};
}
*/