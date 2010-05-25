/* -*- tab-width:4 -*- */

/*
 * Copyright (c) 2010 Eamonn O'Brien-Strain, eob@well.com
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which is available at http://www.eclipse.org/legal/epl-v10.html
 */

/*jslint devel: true */

function Photos() {
    var self = this;
    self.index = -1;
	self.array = [];

	function photoUrlBase(photo) {
		return 'http://farm' + photo.farm +
			  '.static.flickr.com/' + photo.server + 
			  '/' +  photo.id +
			  '_' +  photo.secret;
	}

	self.leftIndex = function () {
	    return (self.index - 1 + self.array.length) % self.array.length;
	};

	self.rightIndex = function () {
	    return self.array[(self.index + 1) % self.array.length];
	};

	self.urlBaseLeft = function () {
	    console.log("urlBaseLeft  photoIndex=" + self.index + " photos.length=" + self.array.length);
		return photoUrlBase(self.array[self.leftIndex()]);
	};

	self.urlBaseCenter = function () {
		console.log("urlBaseCenter  photoIndex="  + self.index + " photos.length=" + self.array.length);
		return photoUrlBase(self.array[self.index]);
	};

	self.urlBaseRight = function () {
		console.log("urlBaseRight  photoIndex=" + self.index + " photos.length=" + self.array.length);
		return photoUrlBase(self.rightIndex());
	};

}
