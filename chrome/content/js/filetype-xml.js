var extensions = ['xml', 'xul'];
var name = "XML";

var validate = function (content) { return []; };

var index = function (content) { 
	var element = new RegExp(/\<(.*?)\s.*?id=['|"](.*?)['|"]/),
		lines = content.split("\n"),
		open = [],
		index = [],
		i;
	for (i = 0; i < lines.length; i++) {
		var match = element.exec(lines[i]);
		if (match) {
			index.push(new awide.FunctionData(match[1] + "#" + match[2], [], i, null));
			index[index.length - 1].end = i;				
		}
	}
	index.sort(awide.sortFuncData);
	return index;	
};
