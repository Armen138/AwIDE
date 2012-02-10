var extensions = ['nsi', 'nsh'];
var name = "NSIS";

var validate = function (content) { return []; };

var index = function (content) {

	var macroMatch = new RegExp(/(!macro|function|section)\s(.*)/i),
		macroendMatch = new RegExp(/(!macro|function|section)end/i),
		macro = "",
		openmacro = [],
		open = [],
		index = [],
		lines = content.split("\n"),
		i,
		selectorLine,
		matches;
	for (i = 0; i < lines.length; i++) {
		matches = macroMatch.exec(lines[i]);
		if (matches) {
			//alert(matches[2]);
			macro = "[" + matches[1].replace("!", "").toLowerCase() + "] " + matches[2];
			openmacro.push(new awide.FunctionData(macro, [], i, null));
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
	index.sort(awide.sortFuncData);
	return index;

};
