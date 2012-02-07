/*global Components, awide */
awide.pathExists = function (path) {
    var localFile = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
    localFile.initWithPath(path);
    if (localFile.exists()) {
		return true;
	}
	return false;
};

awide.Directory = function (path) { 
    'use strict';
	var localDir = null;
	if(typeof path == "string") {
		localDir = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);		
		localDir.initWithPath(path);
	} else {
		localDir = path;
	}

	this.name = localDir.leafName;
	this.path = localDir.path;
	if(localDir.exists() && localDir.isDirectory()){
		//all is good with the world.
	} else {
		awide.status("WARNING: directory does not exist(" + path + ")\n", awide.WARNING);
	}

	this.getFiles = function () {
		var entries = localDir.directoryEntries;
		var files = [];
		while(entries.hasMoreElements()) {
			files.push(entries.getNext().QueryInterface(Components.interfaces.nsIFile));			
		} 
		return files;
	};
};
awide.File = function (path, create) {
    'use strict';
    this.name = null;
    this.content = null;
    this.fullpath = null;
    this.path = null;
    this.frame = null;
    this.index = [];
	this.type = null;
    this.hasChanges = false;
    var localFile = null,
        fstream,
        fileData,
        line = {},
        lines = [],
        more = true,
		filetypes = { js: "javascript", css: "css", html: "htmlmixed", xul: "xml", xml: "xml",
					nsi: "nsis", nsh: "nsis" };		
	if(typeof path == "string"){
		localFile = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile);
		localFile.initWithPath(path);
	} else {
		localFile = path; 
	}
    if (localFile.exists()) {
        fstream = Components.classes["@mozilla.org/network/file-input-stream;1"].createInstance(Components.interfaces.nsIFileInputStream);
        fstream.init(localFile, 0x01, 292, 0);
        fstream.QueryInterface(Components.interfaces.nsILineInputStream);
        //fileData;        
        while (more) {
            more = fstream.readLine(line);
            lines.push(line.value);
        }
        fstream.close();
        //var file = new awide.File(localFile.leafName, lines.join("\n"), localFile.path);  
        this.name = localFile.leafName;
        this.content = lines.join("\n");
        this.fullpath = localFile.path;
        this.path = this.fullpath.replace(this.name, "");
		this.type = awide.fileTypes[filetypes[this.name.substr(this.name.lastIndexOf(".") + 1)]];
	} else {
		if(create) {
			localFile.create(Components.interfaces.nsIFile.NORMAL_FILE_TYPE, 438);
		} else {
			awide.status("WARNING: file does not exist(" + path + ")\n", awide.WARNING);
		}
    }
	
	this.reIndex = function() {
		if (this.type) {
			this.index = this.type.index(this.content);	
		}
	};
	
    this.save = function (noframe) {
        var foStream = Components.classes["@mozilla.org/network/file-output-stream;1"].createInstance(Components.interfaces.nsIFileOutputStream);
        if(!noframe) {
			this.content = this.frame.tab.editor.getValue();
		}
        foStream.init(localFile, 0x02 | 0x08 | 0x20, 438, 0);
        foStream.write(this.content, this.content.length);
        foStream.flush();
        foStream.close();
        this.hasChanges = false;
    };
    this.delete = function () {
		localFile.remove(true);
		this.frame = null;
	};
	this.run = function (args, cb) {
		var process = Components.classes["@mozilla.org/process/util;1"].createInstance(Components.interfaces.nsIProcess);
		process.init(localFile);
		process.run(true, args, args.length);
		cb();
	};
};

awide.uri2path = function(uri) {
	var ioservice = Components.classes["@mozilla.org/network/io-service;1"].getService(Components.interfaces.nsIIOService);
	//alert("uri2path: " + uri);
	var fileUri = ioservice.newURI(uri, null, null);
	var file = fileUri.QueryInterface(Components.interfaces.nsIFileURL).file;	
	return file.path.replace("//", "/");
};


/* some common filetype handling classes */
awide.FunctionData = function (name, args, line, parent) {
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

awide.sortFuncData = function (a, b) {
	if (a.fqdn === b.fqdn) { return 0; }
	if (a.fqdn < b.fqdn) { return -1; }
	return 1;
};	