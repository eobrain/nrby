# Copyright (c) 2010 Eamonn O'Brien-Strain, eob@well.com
# All rights reserved. This program and the accompanying materials
# are made available under the terms of the Eclipse Public License v1.0
# which is available at http://www.eclipse.org/legal/epl-v10.html

.SUFFIXES: .js .linted
VERSION=0.3.0
JSLINT=java -classpath build/js.jar org.mozilla.javascript.tools.shell.Main build/jslint.js
JSDOC=java -jar jsdoc-toolkit/jsrun.jar jsdoc-toolkit/app/run.js -t=jsdoc-toolkit/templates/jsdoc
LINTED=\
 nrby/app/models/photos.linted\
 nrby/app/assistants/first-assistant.linted\
 nrby/app/assistants/stage-assistant.linted\
 test/spec/suite.linted
JS=\
 nrby/app/models/photos.js\
 nrby/app/assistants/first-assistant.js\
 nrby/app/assistants/stage-assistant.js

run: install doc
	palm-launch -c org.eamonn.nrby
	palm-launch org.eamonn.nrby

install: org.eamonn.nrby_$(VERSION)_all.ipk
	palm-install -r org.eamonn.nrby
	palm-install org.eamonn.nrby_$(VERSION)_all.ipk

org.eamonn.nrby_$(VERSION)_all.ipk: lint nrby/appinfo.json nrby/* nrby/*/* nrby/*/*/* 
	palm-package nrby

lint: $(LINTED)

%.linted : %.js
	$(JSLINT) $<
	touch $@

doc:
	$(JSDOC) -d=apidoc -r nrby/app/models nrby/app/assistants

nrby/appinfo.json: appinfo-template.json
	cp appinfo-template.json $@
	: EDIT $@ FILE AND INSERT YOUR FLICKR API KEY
	false

clean:
	rm -r apidoc

