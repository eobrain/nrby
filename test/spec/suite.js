/* -*- tab-width:4 -*- */

/*
 * Copyright (c) 2010 Eamonn O'Brien-Strain, eob@well.com
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which is available at http://www.eclipse.org/legal/epl-v10.html
 */

/* declare globals to keep JSLint happy */
var describe, it, expect, spyOn, jasmine;  //jasmine test framework  
var Photos, Mojo;                //code being tested

describe('Photos', function () {
	var alertMsg, statusMsg, showPhotosCalled, info, status;
	alertMsg = null;
	showPhotosCalled = 0;

	Mojo   = jasmine.createSpyObj('Mojo', ['requireProperty', 'requireFunction']);
	status = jasmine.createSpyObj('Status', ['set', 'reset']);
	info   = jasmine.createSpyObj('Status', ['set']);
	
	function alertUserStub(message) {
	    alertMsg = message;
	}

	function showPhotosStub(left, center, middle) {
	    showPhotosCalled += 1;
	}

    it('can be instantiated', function () {
		var photos;
		photos = new Photos(status, info, alertUserStub, showPhotosStub);
		expect(photos.urlsCenter().length).toEqual(2);
    });

    it('can have their index moved', function () {
		var photos, url1, url2;
		photos = new Photos(status, info, alertUserStub, showPhotosStub);
		url1 = photos.urlsCenter()[0];
		url2 = photos.urlsRight()[0];
		expect(url1).toNotEqual(url2);

		photos.moveRight();
		expect(photos.urlsLeft()[0]).toEqual(url1);
		expect(photos.urlsCenter()[0]).toEqual(url2);

		photos.moveLeft();
		expect(photos.urlsCenter()[0]).toEqual(url1);
		expect(photos.urlsRight()[0]).toEqual(url2);
    });

});
