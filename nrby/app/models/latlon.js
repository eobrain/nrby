/* -*- tab-width:4 -*- */

/*
 * Copyright (c) 2010 Eamonn O'Brien-Strain, eob@well.com
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which is available at http://www.eclipse.org/legal/epl-v10.html
 */

/*jslint devel: true */

/** Create from latitude and longitude (in degrees)
@class A point on the surface of the Earth */
function LatLon(latDeg, lonDeg) {

    var self = this;

    /** latitude in radians */
    this.lat = latDeg * this.RADIANS_PER_DEGREE;

    /** longitude in radians */
    this.lon = lonDeg * this.RADIANS_PER_DEGREE;

    /** @returns distance in meters from another point
	@type Number */
    this.metersFrom = function (that) {
        var sinHalfDLat, sinHalfDLon, a, c;
		sinHalfDLat = Math.sin((that.lat - this.lat) / 2);
		sinHalfDLon = Math.sin((that.lon - this.lon) / 2);
		a = sinHalfDLat * sinHalfDLat +
		    sinHalfDLon * sinHalfDLon * Math.cos(this.lat) * Math.cos(that.lat); 
		c = 2 * Math.atan2(Math.sqrt(a), Math.sqrt(1 - a)); 
		return this.EARTH_RADIUS * c;      
	};

    function bearing(other) {
        var x, y, dLon;
		dLon = other.lon - self.lon;
		y = Math.sin(dLon) * Math.cos(other.lat);
		x = Math.cos(self.lat) * Math.sin(other.lat) - Math.sin(self.lat) * Math.cos(other.lat) * Math.cos(dLon);
		//console.log("self.lon=" + self.lon + " other.lon=" + other.lon + " dLon=" + dLon + " x=" + x + " y=" + y);
		return Math.atan2(y, x);
    }

    /** @returns direction to another point, symbolically ('N', 'NE', 'E', ... )
	@type String */
    this.directionTo = function (that) {
	    //console.log("bearing=" + bearing(that) / this.RADIANS_PER_DEGREE + " degrees");
	    var index = Math.round((bearing(that) + this.CIRCLE) / this.CIRCLE_8th);
		//console.log("direction index = " + index);
		return this.DIRECTIONS[index % 8];
    };

	/** @return the position as a string suitable for passing as HTTP query parameters */
	this.query = function () {
	    return "lat=" + latDeg + "&lon=" + lonDeg;
	};

}

LatLon.prototype.RADIANS_PER_DEGREE = Math.PI / 180;
LatLon.prototype.EARTH_RADIUS  = 6367500; // meters
LatLon.prototype.CIRCLE = 2 * Math.PI;
LatLon.prototype.CIRCLE_8th    = Math.PI / 4;
LatLon.prototype.DIRECTIONS = ['N', 'NE', 'E', 'SE', 'S', 'SW', 'W', 'NW'];
