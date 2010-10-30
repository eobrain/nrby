/* -*- tab-width:4 -*- */

/*
 * Copyright (c) 2010 Eamonn O'Brien-Strain, eob@well.com
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which is available at http://www.eclipse.org/legal/epl-v10.html
 */

/*jslint devel: true */

/** singleton map of Flickr licenses */
var nrbyFlickrLicenses = (function () {
    var flickrLicenseArray, i, n, el, result;

    /** fetched from view-source:http://api.flickr.com/services/rest/?method=flickr.photos.licenses.getInfo&api_key=593a9a9eaec5db8af4b02607cfc43b49&format=json&nojsoncallback=1 */
    flickrLicenseArray = [
		{"id": "0", "name": "All Rights Reserved", "url": ""}, 
		{"id": "4", "name": "Attribution License", "url": "http:\/\/creativecommons.org\/licenses\/by\/2.0\/"}, 
		{"id": "6", "name": "Attribution-NoDerivs License", "url": "http:\/\/creativecommons.org\/licenses\/by-nd\/2.0\/"},
		{"id": "3", "name": "Attribution-NonCommercial-NoDerivs License", "url": "http:\/\/creativecommons.org\/licenses\/by-nc-nd\/2.0\/"}, 
		{"id": "2", "name": "Attribution-NonCommercial License", "url": "http:\/\/creativecommons.org\/licenses\/by-nc\/2.0\/"}, 
		{"id": "1", "name": "Attribution-NonCommercial-ShareAlike License", "url": "http:\/\/creativecommons.org\/licenses\/by-nc-sa\/2.0\/"},
		{"id": "5", "name": "Attribution-ShareAlike License", "url": "http:\/\/creativecommons.org\/licenses\/by-sa\/2.0\/"}, 
		{"id": "7", "name": "No known copyright restrictions", "url": "http:\/\/www.flickr.com\/commons\/usage\/"}, 
		{"id": "8", "name": "United States Government Work", "url": "http:\/\/www.usa.gov\/copyright.shtml"}
    ];

	/** function of element*/
	function canReuse() {
		console.log("el=" + this);
		return this.id !== "0";
	}

    n = flickrLicenseArray.length;
	result = {};
    for (i = 0; i < n; i += 1) {
		el = flickrLicenseArray[i];
		result[el.id] = el;
		el.canReuse = canReuse;
    }
	return result;
	
}());