/*global window, awide */

var filetypes = "nsi|xml";
var isCompatible = function (file){
	'use strict';
	return (file.name.indexOf(".nsi") !== -1);
};

var Project = function (nsis) {
	'use strict';
	this.nsis = nsis;
	awide.status("Opening NSIS Project\n", awide.INFO);
	this.name = nsis.name.replace(".nsi", "");
	this.path = nsis.path;
	this.files = [];
	var self = this;
	this.settings = {
		makensis : { type: "string", label: "Path to makensis.exe", value: "" }
	};

		
	this.run = function () {
		//run NSIS compiler
		var outputtabs = document.getElementById('statustabs');
		if(this.settings.makensis.value == "") {
			alert("You need to set the path to your NSIS compiler in project settings.");
			return;
		}
		//alert(this.settings.makensis.value.replace(/[\\]/g, '\\$&'));
		var exec = new awide.File(this.settings.makensis.value.replace(/[\\]/g, '\\$&'));
		if(exec) {
			var args = ["/O" + this.nsis.path + "nsis.log", this.nsis.fullpath];
			exec.run(args, function () {
				//call this when execution is finished.
				var log = new awide.File(self.nsis.path + "nsis.log");
				var loglines = log.content.split("\n");
				var errorMatch = new RegExp(/Error in script "(.*?)" on line (\d*)/);
				var warningMatch = new RegExp(/\((.*?):(\d*)\)/);
				//Error in script "D:\projects\dtx.comcastModemRelease\installer.nsi" on line 94
				var summary = false;
				var messages = false;
				var match = null;
				for (var i = 0; i < loglines.length; i++) {
					if(match = errorMatch.exec(loglines[i])) {
						awide.debugError({ file: match[1], reason: loglines[i - 1], line: match[2], character: "*"}, awide.ERROR);
					}
					if(loglines[i].indexOf('Output:') != -1){
						summary = true;
					}
					if(loglines[i].match(/\d*\swarnings/)) {
						summary = false;
						messages = true;
					}
					if(summary && loglines[i] != "") {
						//awide.debugError({ file: f, reason: msg.errorMessage, line: msg.lineNumber || "*", character: msg.columnNumber || "*"}, icon);	
						awide.debugError({ file: "", reason: loglines[i], line: "*", character: "*"}, awide.INFO);
					}
					if(messages && loglines[i] != "") {
						if(match = warningMatch.exec(loglines[i])) {
							awide.debugError({ file: match[1], reason: loglines[i].replace(/\(.*?\)/, ""), line: match[2], character: "*"}, awide.WARNING);	
						} else {
							awide.debugError({ file: "", reason: loglines[i], line: "*", character: "*"}, awide.WARNING);
						}
					}
					
				}
			});
			outputtabs.selectedIndex = 2;
		} else {
			alert("You need to set the path to your NSIS compiler in project settings.");
		}
	};
	
	this.rescan = function () {
		this.files = awide.rescan(this.path, this.files, new RegExp('\.(xml|nsi|nsh)$'));
	};
		
	this.rescan();
};
