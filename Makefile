# Copyright (c) 2010 Eamonn O'Brien-Strain, eob@well.com
# All rights reserved. This program and the accompanying materials
# are made available under the terms of the Eclipse Public License v1.0
# which is available at http://www.eclipse.org/legal/epl-v10.html

.SUFFIXES: .js .linted
VERSION=0.5.0
NAME=nrby
ID=org.eamonn.$(NAME)
LINTED=\
 $(NAME)/app/models/photos.linted\
 $(NAME)/app/models/latlon.linted\
 $(NAME)/app/assistants/first-assistant.linted\
 $(NAME)/app/assistants/stage-assistant.linted\
 test/spec/suite.linted
JS=\
 $(NAME)/app/models/photos.js\
 $(NAME)/app/assistants/first-assistant.js\
 $(NAME)/app/assistants/stage-assistant.js
JSLINT=java -classpath build/js.jar org.mozilla.javascript.tools.shell.Main build/jslint.js
JSDOC=java -jar jsdoc-toolkit/jsrun.jar jsdoc-toolkit/app/run.js -t=jsdoc-toolkit/templates/jsdoc

run: install doc
	palm-launch -c $(ID)
	palm-launch $(ID)

install: $(ID)_$(VERSION)_all.ipk
	- palm-install -r $(ID)
	palm-install $(ID)_$(VERSION)_all.ipk

$(ID)_$(VERSION)_all.ipk: lint $(NAME)/appinfo.json $(NAME)/* $(NAME)/*/* $(NAME)/*/*/* 
	palm-package $(NAME)

lint: $(LINTED)

%.linted : %.js
	$(JSLINT) $<
	touch $@

doc:
	$(JSDOC) -d=apidoc -r $(NAME)/app/models $(NAME)/app/assistants

$(NAME)/appinfo.json: appinfo-template.json
	cp appinfo-template.json $@
	: EDIT $@ FILE AND INSERT YOUR FLICKR API KEY
	false

clean:
	rm -r apidoc

publish-doc: doc
	scp -r apidoc $(NAME).eamonn.org:$(NAME).eamonn.org/apidoc
