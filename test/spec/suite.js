/* -*- tab-width:4 -*- */

/*
 * Copyright (c) 2010 Eamonn O'Brien-Strain, eob@well.com
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which is available at http://www.eclipse.org/legal/epl-v10.html
 */

/*jslint devel: true */
/* declare globals to keep JSLint happy */
var setTimeout;
var describe, it, expect, spyOn, jasmine, runs, waits;  //jasmine test framework  
var Photos, LatLon, nrbyFlickrLicenses, Inactivity, Mojo; //code being tested

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
		photos = new Photos(status, alertUserStub, showPhotosStub);
		expect(photos.urlsCenter().length).toEqual(2);
    });

    it('can have their index moved', function () {
		var photos, url1, url2;
		photos = new Photos(status, alertUserStub, showPhotosStub);
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

    it('has a center photo', function () {
		var photos, photo;
		photos = new Photos(status, alertUserStub, showPhotosStub);
		photo = photos.center();
		expect(photo.title).toEqual("San Francisco drops away behind us.");
	});

});

describe('Photo', function () {
	var photos, info, status;

	status = jasmine.createSpyObj('Status', ['set', 'reset']);
	info   = jasmine.createSpyObj('Status', ['set']);

	function alertUserStub(message) {}

	function showPhotosStub(left, center, middle) {}

	photos = new Photos(status, alertUserStub, showPhotosStub);

    it('has title', function () {
		var photo = photos.center();
		expect(photo.title).toEqual("San Francisco drops away behind us.");
	});

    it('has photoPage', function () {
		var photo = photos.center();
		expect(photo.photoPage()).toEqual("http://www.flickr.com/photos/35034364763@N01/126046266/");
	});
});

describe('LatLon', function () {

	function diff(a, b) {
	    console.log("comparing " + a + "\n       to " + b);
	    return 2 * Math.abs(a - b) / (a + b);
	}

	it('can be constructed', function () {
		var sanFrancisco = new LatLon(37.774930, -122.419416);
	});

	it('is a certain distance from another LatLon', function () {
		var sanFrancisco, paloAlto, dublin;
		sanFrancisco = new LatLon(37.774930, -122.419416);
		paloAlto     = new LatLon(37.441883, -122.143020);
		dublin       = new LatLon(53.344104,   -6.267494);
		expect(diff(sanFrancisco.metersFrom(paloAlto),   44110)).toBeLessThan(0.01); //   44.11 km
		expect(diff(sanFrancisco.metersFrom(dublin),   8207250)).toBeLessThan(0.01); // 8207.25 km
	});

	function randomLatLon() {
	    return new LatLon(180 * Math.random() - 90, 360 * Math.random() - 180);
	}

	it('has a commutative distance metric', function () {
		var i, a, b;
		for (i = 0; i < 100; i += 1) {
		    a = randomLatLon();
		    b = randomLatLon();
			expect(diff(a.metersFrom(b), b.metersFrom(a))).toBeLessThan(0.0001);
		}
	});

	it('has metric that obeys the triangle inequality', function () {
		var i, a, b, c, ab, bc, ac;
		for (i = 0; i < 100; i += 1) {
		    a = randomLatLon();
		    b = randomLatLon();
		    c = randomLatLon();
			ab = a.metersFrom(b);
			bc = b.metersFrom(c);
			ac = a.metersFrom(c);
			expect(ab + bc).toBeGreaterThan(ac);
		}
	});

	it('is at a certain bearing relative to another nearby  LatLon', function () {
		var sanFrancisco, paloAlto;
		sanFrancisco = new LatLon(37.774930, -122.419416);
		paloAlto     = new LatLon(37.441883, -122.143020);
		expect(sanFrancisco.directionTo(paloAlto)).toEqual('SE');
		expect(paloAlto.directionTo(sanFrancisco)).toEqual('NW');
	});

	it('is at a certain bearing relative to another far away  LatLon', function () {
		var sanFrancisco, dublin, london, algeria;
		london       = new LatLon(51.478790, 0);
		algeria      = new LatLon(35.830873, 0);
		sanFrancisco = new LatLon(37.774930, -122.419416);
		dublin       = new LatLon(53.344104,   -6.267494);
		expect(london.directionTo(algeria)).toEqual('S');
		expect(algeria.directionTo(london)).toEqual('N');
		expect(london.directionTo(dublin)).toEqual('NW');
		expect(dublin.directionTo(london)).toEqual('SE');
		expect(sanFrancisco.directionTo(dublin)).toEqual('NE');
		expect(dublin.directionTo(sanFrancisco)).toEqual('NW');
	});

	
	

	it('converts bearings to symbolic values', function () {

		function p(lat, lon) {
		    return new LatLon(lat, lon);
		}

		expect(p(0, 0).directionTo(p(1,   0))).toEqual('N');
		expect(p(0, 0).directionTo(p(1,   1))).toEqual('NE');
		expect(p(0, 0).directionTo(p(0,   1))).toEqual('E');
		expect(p(0, 0).directionTo(p(-1,  1))).toEqual('SE');
		expect(p(0, 0).directionTo(p(-1,  0))).toEqual('S');
		expect(p(0, 0).directionTo(p(-1, -1))).toEqual('SW');
		expect(p(0, 0).directionTo(p(0,  -1))).toEqual('W');
		expect(p(0, 0).directionTo(p(1,  -1))).toEqual('NW');
	});

	it('converts bearings to symbolic values, rounding', function () {

		function noise() {
		    return Math.random() * 0.4 - 0.2;
		}

		function p(lat, lon) { //randomized
		    return new LatLon(lat + noise(), lon + noise());
		}

		expect(p(0, 0).directionTo(p(1,   0))).toEqual('N');
		expect(p(0, 0).directionTo(p(1,   1))).toEqual('NE');
		expect(p(0, 0).directionTo(p(0,   1))).toEqual('E');
		expect(p(0, 0).directionTo(p(-1,  1))).toEqual('SE');
		expect(p(0, 0).directionTo(p(-1,  0))).toEqual('S');
		expect(p(0, 0).directionTo(p(-1, -1))).toEqual('SW');
		expect(p(0, 0).directionTo(p(0,  -1))).toEqual('W');
		expect(p(0, 0).directionTo(p(1,  -1))).toEqual('NW');
	});

	it('can generate query parameters', function () {
		var sanFrancisco = new LatLon(37.774930, -122.419416);
		expect(sanFrancisco.query()).toEqual('lat=37.77493&lon=-122.419416');
	});

});

describe('Number', function () {

	var region = null;
	Mojo.Locale = {
		getCurrentFormatRegion: function () {
			return region;
		}
	};

	it('converts from metres to locale-specific string', function () {
		region = "ie";
		expect((100).metersLocalized()).toEqual("100 m");
		expect((30.48).metersLocalized()).toEqual("30 m");
		expect((30).metersLocalized()).toEqual("30 m");
		expect((1000).metersLocalized()).toEqual("1 km");
		expect((1609).metersLocalized()).toEqual("1.6 km");
		expect((1609.344).metersLocalized()).toEqual("1.6 km");
	});

	it('converts from metres to non-metric units in the USA', function () {
		region = "us";
		expect((100).metersLocalized()).toEqual("330 ft");
		expect((30.48).metersLocalized()).toEqual("100 ft");
		expect((30).metersLocalized()).toEqual("98 ft");
		expect((1000).metersLocalized()).toEqual("0.6 mi");
		expect((1609).metersLocalized()).toEqual("1 mi");
		expect((1609.344).metersLocalized()).toEqual("1 mi");
	});

});

describe('Licenses', function () {

	it('includes all-rights-reserved license', function () {
		expect(nrbyFlickrLicenses[0].name).toEqual('All Rights Reserved');
	});

	it('includes a creative-commons license', function () {
		expect(nrbyFlickrLicenses[2].name).toEqual('Attribution-NonCommercial License');
	});

	it('may have URLs', function () {
		expect(nrbyFlickrLicenses[2].url).toEqual("http:\/\/creativecommons.org\/licenses\/by-nc\/2.0\/");
	});

	it('can be re-usable', function () {
		expect(nrbyFlickrLicenses[0].canReuse()).toEqual(false);
		expect(nrbyFlickrLicenses[2].canReuse()).toEqual(true);
		expect(nrbyFlickrLicenses[4].canReuse()).toEqual(true);
		expect(nrbyFlickrLicenses[7].canReuse()).toEqual(true);
		expect(nrbyFlickrLicenses[8].canReuse()).toEqual(true);
	});

});

describe('Inactivity', function () {

	it('can cause a function to be executed in the future', function () {

		runs(function () {
			var inactivity, self;
			inactivity = new Inactivity(1000);
			Inactivity.userActivity();
			this.start = new Date().getTime();
			this.later = null;
			inactivity.execWhenInactive(function () {
				this.later = new Date().getTime() - this.start;
			}.bind(this));
		});

		waits(3000);

		runs(function () {
			expect(this.later).toBeTruthy();
			expect(this.later).toBeGreaterThan(1000 - 10);
			expect(this.later).toBeLessThan(2000);
		});
		
	});

	it('can cause a functions execution to be delayed by activity', function () {

		runs(function () {
			var inactivity, self;
			inactivity = new Inactivity(1000);
			Inactivity.userActivity();
			this.start = new Date().getTime();
			this.later = null;

			inactivity.execWhenInactive(function () {
				this.later = new Date().getTime() - this.start;
				console.log("Setting later to " + this.later);
			}.bind(this));

			setTimeout(Inactivity.userActivity, 800);
			setTimeout(Inactivity.userActivity, 1600);
			setTimeout(Inactivity.userActivity, 2400);
		});

		waits(5400);

		runs(function () {
			expect(this.later).toBeTruthy();
			expect(this.later).toBeGreaterThan(3400 - 10);
			expect(this.later).toBeLessThan(4400);
		}, 5400);

	});



});

