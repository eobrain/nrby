# Copyright (c) 2010 Eamonn O'Brien-Strain, eob@well.com
# All rights reserved. This program and the accompanying materials
# are made available under the terms of the Eclipse Public License v1.0
# which is available at http://www.eclipse.org/legal/epl-v10.html

VERSION=0.3.0

JSLINT=java -classpath build/js.jar org.mozilla.javascript.tools.shell.Main build/jslint.js

run: install 
	cd ..; palm-launch -c org.eamonn.nrby; palm-launch org.eamonn.nrby

install: ../org.eamonn.nrby_$(VERSION)_all.ipk
	cd ..; palm-install -r org.eamonn.nrby; palm-install org.eamonn.nrby_$(VERSION)_all.ipk

../org.eamonn.nrby_$(VERSION)_all.ipk: lint appinfo.json * */* */*/* 
	cd ..; palm-package nrby

lint:
	$(JSLINT) app/assistants/first-assistant.js
	$(JSLINT) app/assistants/stage-assistant.js

appinfo.json: appinfo-template.json
	cp appinfo-template.json $@
	: EDIT appinfo.json FILE AND INSERT YOUR FLICKR API KEY
	false