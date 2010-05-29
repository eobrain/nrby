/* -*- tab-width:4 -*- */

/*
 * Copyright (c) 2010 Eamonn O'Brien-Strain, eob@well.com
 * All rights reserved. This program and the accompanying materials
 * are made available under the terms of the Eclipse Public License v1.0
 * which is available at http://www.eclipse.org/legal/epl-v10.html
 */

function StageAssistant() {
	/* this is the creator function for your stage assistant object */
}

StageAssistant.prototype.setup = function () {
    /* this function is for setup tasks that have to happen when the stage is first created */

    this.controller.pushScene("first");

	/* allow rotation */
	if (this.controller.setWindowOrientation) {
	    this.controller.setWindowOrientation("free");
	}

};
