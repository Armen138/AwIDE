var extensions = ['css'];
var name = "CSS";
Components.utils.import("chrome://awide/content/lib/csslint.jsm");

var validate = function (content) {
	var msgTypes = { warning: awide.WARNING, error: awide.ERROR, info: awide.INFO };
	var results = CSSLint.verify(content, awide.csslint_options);
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
			/*if(errors[i].line) {
				lint_markers.push(this.editor.setMarker(errors[i].line - 1, " ", msgclass));
			}*/
		}
	}
	//awide.setFileStatus("CSS" + ": " + count.error + " errors, " + count.warning + " warnings in " + self.file.name);
	return errors;			
};

this.index = function (content) {
	var selectorMatch = new RegExp(/(.*?)\{/),
		selector = "",
		open = [],
		index = [],
		lines = content.split("\n"),
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
				open.push(new awide.FunctionData(selector, [], selectorLine, null));
			} else {
				//wild guess: selector is alone on the line, no parenthesis.
				open.push(new awide.FunctionData(lines[selectorLine].replace(/\s/g, ""), [], selectorLine, null));
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
	index.sort(awide.sortFuncData);
	return index;
};
