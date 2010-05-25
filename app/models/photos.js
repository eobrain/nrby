/* -*- tab-width:4 -*- */

/*
 * Copyright (c) 2010 Eamonn O'Brien-Strain, eob@well.com
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which is available at http://www.eclipse.org/legal/epl-v10.html
 */

/*jslint devel: true */

/* declare globals to keep JSLint happy */
var Class;

function photoUrlBase(photo) {
	return 'http://farm' + photo.farm +
		  '.static.flickr.com/' + photo.server + 
		  '/' +  photo.id +
		  '_' +  photo.secret;
}


var Photos = Class.create({

	index: -1,
	array: [],

	leftIndex: function () {
		return (this.index - 1 + this.array.length) % this.array.length;
	},

	rightIndex: function () {
		return this.array[(this.index + 1) % this.array.length];
	},

	urlBaseLeft: function () {
		console.log("urlBaseLeft  photoIndex=" + this.index + " photos.length=" + this.array.length);
		return photoUrlBase(this.array[this.leftIndex()]);
	},
	urlBaseCenter: function () {
		console.log("urlBaseCenter  photoIndex="  + this.index + " photos.length=" + this.array.length);
		return photoUrlBase(this.array[this.index]);
	},

	urlBaseRight: function () {
		console.log("urlBaseRight  photoIndex=" + this.index + " photos.length=" + this.array.length);
		return photoUrlBase(this.rightIndex());
	}

});
