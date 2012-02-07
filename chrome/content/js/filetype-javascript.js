var extensions = ['js'];
var name = "JavaScript";

Components.utils.import("chrome://awide/content/lib/jslint.jsm");

var validate = function (content) {	
    var i, pass;
	pass = JSLINT(content, awide.jslint_options);
	if (!pass) {
		return JSLINT.errors;
	}	
	return [];
}

var index = function (content) {
	//index symbols	
	var globalFunc = new RegExp(/function(.*?)\((.*?)\)/),
		classFunc = new RegExp(/var(.*?)=\s?function\s?\((.*?)\)/),
		namespaceFunc = new RegExp(/(.*?)\.(.*?)=\s?function\s?\((.*?)\)/),
		lines = content.split("\n"),
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
						parent = new awide.FunctionData(namespace, [], 0, null);
					}
				}										
			}
			
			if (open.length > 0 && !parent) {
				parent = open[open.length -1];
			}
			if (func != "") {
				open.push(new awide.FunctionData(func, args, functionLine, parent));								
			} else { 
				open.push(new awide.FunctionData("{anonymous}", [], i, null));
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
	index.sort(awide.sortFuncData);
	return index;
	
};
	
