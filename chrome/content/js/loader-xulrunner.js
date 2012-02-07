/*global awide */
var isCompatible = function (file){
	'use strict';
	return (file.name === "application.ini");
};

var Project = function (ini) {
	'use strict';
	awide.status("Opening Xulrunner Project\n", awide.INFO);
	var project = awide.ini2object(ini.content);
	this.name = project.App.Name;
	this.path = ini.path;
	this.runpath = ini.fullpath;
	this.chromeAlias = {};
	this.files = [];
	this.rescan = function () {
		this.files = awide.rescan(this.path, this.files);
	};
	this.rescan();
};