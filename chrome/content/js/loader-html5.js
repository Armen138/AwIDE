/*global window, awide, Components */
var isCompatible = function (file) {
	'use strict';
	return (file.name === "index.html");
};

var Project = function (index) {
	'use strict';
	this.index = index;
	this.appwindow = null;
	this.isRunning = false;
	this.consoleService = null;
	awide.status("Opening HTML5 Project\n", awide.INFO);
	this.name = "projectTitle";
	this.path = index.path;
	this.files = [];
	var titleRegexp = new RegExp("<title>(.*?)<\/title>", "g");
	var tmatch = titleRegexp.exec(index.content);
	var self = this;
	if(tmatch) {
		this.name = tmatch[1];
	}

	this.run = function () {
		var outputtabs = document.getElementById('statustabs');
		awide.status("run: " + "file:///" + index.fullpath.replace(/\\/g, "/"), awide.INFO);			
		this.appwin = window.open("file:///" + index.fullpath.replace(/\\/g, "/"), "AwIDE" + this.name, "chrome, width=800, height=600");
		document.getElementById("runproject").setAttribute("disabled", true);
		if (!this.consoleService) {
			this.consoleService = Components.classes["@mozilla.org/consoleservice;1"].getService(Components.interfaces.nsIConsoleService);
		}
		this.consoleService.registerListener(this.consoleListener);
	
		this.appwin.addEventListener("DOMContentLoaded", function () {
			self.isRunning = true;
			self.appwin.awide = awide;
		});

		this.appwin.addEventListener("unload", function () {
			
			if (self.consoleService && self.consoleListener && self.isRunning) {
				self.consoleService.unregisterListener(self.consoleListener);
				self.isRunning = false;
				document.getElementById("runproject").setAttribute("disabled", false);
			}			
		});
		outputtabs.selectedIndex = 2;
	};
	
	this.runSystem = function() {
		var ioservice = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);
		var uri = ioservice.newURI("file:///" + index.fullpath.replace(/\\/g, "/"), null, null);
		var extps = Components.classes["@mozilla.org/uriloader/external-protocol-service;1"].getService(Components.interfaces.nsIExternalProtocolService);
		extps.loadURI(uri, null);
	};
	
	this.rescan = function () {
		this.files = awide.rescan(this.path, this.files);
	};
		
	this.rescan();
	
	this.myFile = function (path) {
        var i;
		for(i = 0; i < this.files.length; i++) {
			if (this.files[i].fullpath == path) {
				//awide.status("strcmp: " + path + " == " + this.files[i].fullpath, awide.INFO);
				return true;
			}
		}
		return false;
	};
	
	this.consoleListener = {
		observe:function( c ){
			var msg = c.QueryInterface(Components.interfaces.nsIScriptError);		
			var f;			
			if (msg.sourceName.indexOf("file:/") != -1) {
				f = awide.uri2path(msg.sourceName);					
				if(self.myFile(f)){
					var icon = awide.ERROR;
					if(msg.flags & 0x1) {
						icon = awide.WARNING;
					}		
					awide.debugError({ file: f, reason: msg.errorMessage, line: msg.lineNumber || "*", character: msg.columnNumber || "*"}, icon);	
					//awide.status(msg.flags + " " + msg.errorMessage + " : " + msg.sourceName, icon);
				} else {
					//awide.status("console message does not belong to this project: " + msg.errorMessage + "(" + f + ")", awide.ERROR);
				}
			} else { 
				//awide.status("console message does not belong to this project: " + msg.errorMessage + "(" + msg.sourceName + ")", awide.ERROR);
			}

		},		
		QueryInterface: function (iid) {
		if (!iid.equals(Components.interfaces.nsIConsoleListener) &&
				!iid.equals(Components.interfaces.nsISupports)) {
			throw Components.results.NS_ERROR_NO_INTERFACE;
			}
			return this;
		}		
	};
	
};
