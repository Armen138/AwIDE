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
		
		/*
		lint_markers = [];
		if (this.type === "js") {
            pass = JSLINT(this.editor.getValue(), awide.jslint_options);
			if (!pass) {
				for (i = 0; i < JSLINT.errors.length; i += 1) {
					if (JSLINT.errors[i] !== null) {
						lint_markers.push(this.editor.setMarker(JSLINT.errors[i].line - 1, " ", "lint-error"));
					}
				}
				awide.setFileStatus("Javascript" + ": " + JSLINT.errors.length + " errors in " + self.file.name);
				return JSLINT.errors;
			}
		} else if (this.type === "css") {
			var results = CSSLint.verify(this.editor.getValue(), awide.csslint_options);
			var errors = [];
			var count = { error: 0, warning: 0, info: 0 };
			for (i = 0; i < results.messages.length; i++) {
				count[results.messages[i].type] += 1;
				errors.push({reason: results.messages[i].message, line: results.messages[i].line, character: results.messages[i].col, type: msgTypes[results.messages[i].type] });				
			}
			for (i = 0; i < errors.length; i += 1) {
				if (errors[i] !== null) {
					var msgclass = "lint-error";
					if(errors[i].type === awide.WARNING) { 
						msgclass = "lint-warning";
					}
					if(errors[i].line) {
						lint_markers.push(this.editor.setMarker(errors[i].line - 1, " ", msgclass));
					}
				}
			}
			
			awide.setFileStatus("CSS" + ": " + count.error + " errors, " + count.warning + " warnings in " + self.file.name);
			return errors;			
		}
        awide.setFileStatus("No errors in " + self.file.name);
		return [];*/
	};
	this.FunctionData = function (name, args, line, parent) {
		this.name = name;
		//this.name = this.name.replace(/\s/g, "");
		this.args = args;
		this.start = line;
		this.end = null;
		this.parent = parent;
		if (this.parent) {
			this.fqdn = this.parent.fqdn + "." + this.name;
		} else {
			this.fqdn = this.name;
		}
	};

	this.sortFuncData = function (a, b) {
        if (a.fqdn === b.fqdn) { return 0; }
        if (a.fqdn < b.fqdn) { return -1; }
		return 1;
	};

	this.parse = function () {
		switch (this.type) {
		case "js":
		case "html":
			return this.parseJS();
		case "css":
            return this.parseCSS();
		case "xul":
		case "xml":
			return this.parseXML();
		case "nsi":
		case "nsh":
			return this.parseNSI();
		default:
			return [];
		}
	};

	this.parseNSI = function () {
		var macroMatch = new RegExp(/(!macro|function|section)\s(.*)/i),
			macroendMatch = new RegExp(/(!macro|function|section)end/i),
			macro = "",
			openmacro = [],
			open = [],
			index = [],
            lines = this.file.content.split("\n"),
            i,
            selectorLine,
            matches;
		for (i = 0; i < lines.length; i++) {
			matches = macroMatch.exec(lines[i]);
			if (matches) {
				//alert(matches[2]);
				macro = "[" + matches[1].replace("!", "").toLowerCase() + "] " + matches[2];
				openmacro.push(new this.FunctionData(macro, [], i, null));
			}
			if (macroendMatch.exec(lines[i])) {
				if (openmacro.length > 0) {	
					var current = openmacro[openmacro.length -1];
					current.end = i;					
					index.push(current);				
					openmacro.splice(open.length -1, 1);
				}
			}
		}
		index.sort(this.sortFuncData);
		return index;
	};
	
	this.parseCSS = function () {
		var selectorMatch = new RegExp(/(.*?)\{/),
			selector = "",
			open = [],
			index = [],
            lines = this.file.content.split("\n"),
            i,
            selectorLine,
            matches;
		for (i = 0; i < lines.length; i++) {
			if (lines[i].indexOf("{") !== -1) {
				selectorLine = i;
				if (lines[i].replace(/\s/g, "").indexOf("{") === 0) {
					selectorLine -= 1;
				}
				matches = selectorMatch.exec(lines[selectorLine]);
				if (matches) {
					selector = matches[1].replace(/\s/g, "");
					open.push(new this.FunctionData(selector, [], selectorLine, null));
				} else {
					//wild guess: selector is alone on the line, no parenthesis.
					open.push(new this.FunctionData(lines[selectorLine].replace(/\s/g, ""), [], selectorLine, null));
				}		
			}
			if (lines[i].indexOf("}") !== -1) {
				if (open.length > 0) {			
					var current = open[open.length -1];
					current.end = i;
					if (current.name !== "{anonymous}") {
						index.push(current);
					}
					open.splice(open.length -1, 1);
				}
			}			
		}
		index.sort(this.sortFuncData);
		return index;
	};
	
	this.parseXML = function () { 
		var element = new RegExp(/\<(.*?)\s.*?id=['|"](.*?)['|"]\s/),
			lines = this.file.content.split("\n"),
			open = [],
			index = [],
            i;
		for (i = 0; i < lines.length; i++) {
			var match = element.exec(lines[i]);
			if (match) {
				index.push(new this.FunctionData(match[1] + "#" + match[2], [], i, null));
				index[index.length - 1].end = i;				
			}
		}
		index.sort(this.sortFuncData);
		return index;	
	};
	
	this.parseJS = function () {
		//have need to know what function starts where.		
		var globalFunc = new RegExp(/function(.*?)\((.*?)\)/),
			classFunc = new RegExp(/var(.*?)=\s?function\s?\((.*?)\)/),
			namespaceFunc = new RegExp(/(.*?)\.(.*?)=\s?function\s?\((.*?)\)/),
			lines = this.file.content.split("\n"),
			index = [],
			open = [],
			func = "", 
			args = "",
			parent = null,
            i;
		for (i = 0; i < lines.length; i++) {
			func = "";
			args = "";
			parent = null;
			var accIdx = lines[i].indexOf("{");
			if (accIdx != -1 && lines[i][accIdx - 1] != "\\") {
				var functionLine = i;
				//if(lines[i].indexOf("function") == -1) {
				if (lines[i].replace(/\s/g, "").indexOf("{") === 0 && lines[i - 1].indexOf("function") !== -1) {
					functionLine = i - 1;
				}
				var matches = globalFunc.exec(lines[functionLine]);
				if (matches) {
					func = matches[1].replace(/\s/g, ""); //strip spaces
					args = matches[2].replace(/\s/g, ""); //strip spaces
					args = args.split(",");
				}
				if (func === "") {
					matches = classFunc.exec(lines[functionLine]);
					if(matches){
						func = matches[1].replace(/\s/g, "");
						args = matches[2].replace(/\s/g, "");
						args = args.split(",");
					}
				}
				if (func === "") {
					matches = namespaceFunc.exec(lines[functionLine]);
					if (matches) {
						var namespace = matches[1].replace(/\s/g, "");
						func = matches[2].replace(/\s/g, "");
						args = matches[3].replace(/\s/g, "");
						args = args.split(",");					
						if (namespace === "this") {
							parent = open[open.length - 1];
						} else {							
							parent = new this.FunctionData(namespace, [], 0, null);
						}
					}										
				}
				
				if (open.length > 0 && !parent) {
					parent = open[open.length -1];
				}
				if (func != "") {
					open.push(new this.FunctionData(func, args, functionLine, parent));								
				} else { 
					open.push(new this.FunctionData("{anonymous}", [], i, null));
				}
			}
			if (lines[i].indexOf("}") != -1) {
				if (open.length > 0) {
					var current = open[open.length -1];
					current.end = i;
					if (current.name !== "{anonymous}") {
						index.push(current);
					}
					open.splice(open.length -1, 1);
				}
			}
		}
		index.sort(this.sortFuncData);
		return index;
		
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
