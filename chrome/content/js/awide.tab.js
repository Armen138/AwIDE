/*global document, window, JSLINT, CodeMirror, $ */
var awide = top.awide;
var tab = {}; //namespace for this file
var filetypes = { js: "javascript", css: "css", html: "htmlmixed", xul: "xml", xml: "xml",
					nsi: "nsis", nsh: "nsis" };
var msgTypes = { warning: awide.WARNING, error: awide.ERROR, info: awide.INFO };
var lint_markers = [];
var search_markers = [];
var Tab = function (file) {
    'use strict';
	var self = this;
	this.file = file;
	this.editorelement = null;
	this.editor = null;
	this.searchResult = {line: 0, ch: 0, term: ""}; //line/char and search term
	this.type = this.file.name.substring(this.file.name.lastIndexOf(".") + 1);
	this.indicatorNode = document.createElement("div");
	this.indicatorNode2 = document.createElement("div");
	$(this.indicatorNode).addClass("line-indicator");
	$(this.indicatorNode2).addClass("line-indicator2");
	this.currentResults = [];
	this.onChange = function () {
		awide.markUnsaved(self.file);
	};
    this.onCursorActivity = function () {
		awide.setPosStatus(self.editor.coordsChar(self.editor.cursorCoords()));
	};

	this.editor = CodeMirror($("#mainbox").get(0), {
		value: this.file.content,
		mode:  filetypes[this.type],
		lineNumbers: true,
		matchBrackets: true,
		onChange: self.onChange,
		onCursorActivity: self.onCursorActivity,
		indentUnit: 4,
		tabSize: 4,
		theme: awide.theme
	});

	this.setTheme = function (theme) {
		this.editor.setOption("theme", theme);
	};

	this.clearSearch = function() {
		for(var i = 0; i < search_markers.length; i++){
			search_markers[i].clear();
		}
		search_markers = [];		
	};
	/*
	this.replace = function (newtext) {
		for (var i = 0; i < this.currentResults.length; i++) {
			this.editor.replaceRange(newtext, this.currentResults[i].from, this.currentResults[i].to);
		}
	};
	*/
	this.replaceAll = function (orig, newtext, selection) {
		var text;
		var cpos;
		if(selection) {
			text = this.editor.getSelection();			 
		} else {
			cpos = this.editor.cursorCoords();
			text = this.editor.getValue();
		}		
		text = text.replace(orig, newtext);		
		if(selection) {
			this.editor.replaceSelection(text);			
		} else {
			this.editor.setValue(text);
			this.editor.scrollTo(cpos.x, cpos.y);
		}		
	};
	
	this.find = function (searchterm) {	
		awide.clearSearch();	
		var line = 0, ch = 0;
		var lines = this.editor.getValue().split("\n");
		for(var i = 0; i < search_markers.length; i++){
			search_markers[i].clear();
		}
		search_markers = [];
		/*if(this.searchResult.term === searchterm) {
			line = this.searchResult.line;
		}*/		
		for (var i = line; i < lines.length; i++) {
			ch = lines[i].indexOf(searchterm);
			if(ch !== -1) {				
				search_markers.push(this.editor.markText({line: i, ch: ch}, {line: i, ch: ch + searchterm.length}, "search-result"));
				awide.searchResult({line: i, character: ch, message: lines[i].replace(/^\s*/, "")});
			}
		}		
	};
	
	this.validate = function () {
        var i,
            pass,
			errors = [],
			count = { error: 0, warning: 0 };
		for (i = 0; i < lint_markers.length; i += 1) {
			this.editor.clearMarker(lint_markers[i]);
		}
		if (this.file.type) {
			errors = this.file.type.validate(this.file.content);
			if (errors.length > 0) {
				for (i = 0; i < errors.length; i += 1) {
					if (errors[i] !== null) {
						lint_markers.push(this.editor.setMarker(errors[i].line - 1, " ", "lint-error"));
						if (!errors[i].type || (errors[i].type && errors[i].type == awide.ERROR)) {
							count.error++;
						} else if(errors[i].type == awide.WARNING) {
							count.warning++;
						}
					}
				}
			}
			awide.setFileStatus(this.file.type.name + ": " + count.error + " errors, " + count.warning + " warnings in " + self.file.name);
		}
		
		return errors;
	};
};
function hideIndicator() {
	$(tab.indicatorNode).hide();
	$(tab.indicatorNode2).hide();
}

function lineIndicator(pos, alt) {
    'use strict';	
    var indicator = tab.indicatorNode;
    if(alt){
		indicator = tab.indicatorNode2;
	}	
	pos.line -= 1;	
	tab.editor.addWidget(pos, indicator, true);
	$(indicator).show();
}

function showTab(file) {
    'use strict';
	tab = new Tab(file);
	//tab.parse();
}
