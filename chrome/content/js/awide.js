/*global Components, document, window, top */
Components.utils.import("resource://gre/modules/ctypes.jsm");
var awide = {};
awide.debug = true;
awide.activeProject = null;
awide.projectOptions = null;
awide.eventListeners = { "load": [], "save": [], "load-project": [] };
awide.projects = {};
awide.OS = Components.classes["@mozilla.org/xre/app-info;1"].getService(Components.interfaces.nsIXULRuntime).OS;
awide.WARNING = "chrome://awide/content/icons/dialog-warning.png";
awide.ERROR = "chrome://awide/content/icons/dialog-error.png";
awide.INFO = "chrome://awide/content/icons/dialog-information.png";

awide.projectLoaders = {};
awide.fileTypes = {};
awide.scriptLoader = Components.classes["@mozilla.org/moz/jssubscript-loader;1"].getService(Components.interfaces.mozIJSSubScriptLoader);

awide.prefManager = Components.classes["@mozilla.org/preferences-service;1"].getService(Components.interfaces.nsIPrefBranch);

awide.jslint_options = {};
awide.csslint_options = {};
awide.theme = "default";
awide.hidelib = false;
awide.contextCell = {};
awide.addEventListener = function (event, handler) {
    'use strict';
    if (awide.eventListeners[event]) {
        awide.eventListeners[event] = handler;
    } else {
        awide.status("no such event in awide: " + event, awide.WARNING);
    }
};
awide.$fireEvent = function (event, arg) {
    'use strict';
    var i;
    for (i = 0; i < awide.eventListeners[event].length; i += 1) {
        awide.eventListeners[event](arg);
    }
};

awide.$getLoaders = function () {
	var root = "chrome://awide/content/js/";	
	var files;	
    var ios = Components.classes['@mozilla.org/network/io-service;1'].getService(Components.interfaces["nsIIOService"]);
    var uri = ios.newURI(root, "UTF-8", null);
    var cr = Components.classes['@mozilla.org/chrome/chrome-registry;1'].getService(Components.interfaces["nsIChromeRegistry"]);
    var loaderName;
    var i;
    rv = cr.convertChromeURL(uri).spec;	
	//root = new awide.Directory(awide.fixSlashes(rv.replace("file://", "")));
	root = new awide.Directory(awide.uri2path(rv));
	files = root.getFiles();
    for (i = 0; i < files.length; i++) {        
        if (files[i].leafName.indexOf("loader") == 0) {
			//this is a loader script.
			loaderName = files[i].leafName.substr(files[i].leafName.indexOf("-") + 1).replace(".js", "");                			
			awide.status("Registered project loader: " + loaderName, awide.INFO);
			awide.projectLoaders[loaderName] = {};
			awide.scriptLoader.loadSubScript("chrome://awide/content/js/" + files[i].leafName + (awide.debug ? "?" + Math.random() : ""), awide.projectLoaders[loaderName], "UTF-8");
		}
    }
};


awide.$getFileTypes = function () {
	var root = "chrome://awide/content/js/";	
	var files;	
    var ios = Components.classes['@mozilla.org/network/io-service;1'].getService(Components.interfaces["nsIIOService"]);
    var uri = ios.newURI(root, "UTF-8", null);
    var cr = Components.classes['@mozilla.org/chrome/chrome-registry;1'].getService(Components.interfaces["nsIChromeRegistry"]);
    var loaderName;
    var i;
    rv = cr.convertChromeURL(uri).spec;	
	//root = new awide.Directory(awide.fixSlashes(rv.replace("file://", "")));
	root = new awide.Directory(awide.uri2path(rv));
	files = root.getFiles();
    for (i = 0; i < files.length; i++) {        
        if (files[i].leafName.indexOf("filetype") == 0) {
			//this is a filetype script.
			ftName = files[i].leafName.substr(files[i].leafName.indexOf("-") + 1).replace(".js", "");                			
			awide.status("Registered filetype: " + ftName, awide.INFO);
			awide.fileTypes[ftName] = {};
			awide.scriptLoader.loadSubScript("chrome://awide/content/js/" + files[i].leafName + (awide.debug ? "?" + Math.random() : ""), awide.fileTypes[ftName], "UTF-8");
		}
    }
};

awide.processObserver = function () {
    'use strict';
    this.observe = function (subject, topic, data) {
        awide.status(subjtect + ", " + topic + ", " + data);
    };
};

awide.breakpoint = function () {
	awide.stacktrace();
};

awide.stacktrace = function () {	
	outputlist = document.getElementById("stackoutputlist");
	while (outputlist.itemCount > 0) {
		outputlist.removeItemAt(0);
	}	
	try {
		awide.undefined.error = "stacktrace";
	} catch(e) {
		var trace = e.stack.split("\n");
		var matchFunc = new RegExp(/(.*?)@(.*js):(\d*)/);
		var i, f, line, func, file;		
		for(i = 0; i < trace.length; i++) {
			var matches = matchFunc.exec(trace[i]);
			if(matches) {
				func = matches[1];
				file = matches[2];
				line = parseInt(matches[3], 10);
				if(file.indexOf("file:") != -1) {
					pfile = awide.fileIn({fullpath: awide.uri2path(file)}, awide.activeProject.files);
					if(pfile) {	
						if(pfile.index.length == 0) {
							pfile.reIndex();
						}
						for(f = 0; f < pfile.index.length; f++) {
							if(pfile.index[f].start < line && pfile.index[f].end > line) {
								func = pfile.index[f].fqdn + " " + func;												
							}							
						}
						awide.stackFunction(func, awide.uri2path(file), line);
					}
				}				
			} else {
				// )) (( 
			}
		}
	}
};

awide.showExtensionsManager = function() {
	window.open("chrome://mozapps/content/extensions/extensions.xul?type=extensions", "extensions", "chrome,centerscreen");
};

awide.projectPreferences = function () {
    'use strict';
    awide.projectOptions = window.open("chrome://awide/content/project-preferences.xul", "popt", "chrome,centerscreen");//, "Project Preferences", "chrome,titlebar,toolbar,centerscreen,dialog=yes");	
	awide.projectOptions.addEventListener("DOMContentLoaded", function() {
		awide.projectOptions.awide = awide;
		var vbox = awide.projectOptions.document.getElementById("project-options-panel");
		var option;
		for (option in awide.activeProject.settings) {			
			var hbox = document.createElement('hbox');		
			var label = document.createElement('label');
			var entry = document.createElement('textbox');
			label.setAttribute('value', awide.activeProject.settings[option].label);
			entry.setAttribute('value', awide.activeProject.settings[option].value);
			label.setAttribute('flex', '1');		
			entry.setAttribute('flex', '1');
			entry.setAttribute('id', option);
			hbox.appendChild(label);
			hbox.appendChild(entry);
		}
		vbox.appendChild(hbox);
		
	});
};

awide.saveProjectOptions = function () {
	try{
	var inputs = awide.projectOptions.document.getElementsByTagName('textbox');
	var i;
	for (i = 0; i < inputs.length; i++) {
		var setting = inputs[i].getAttribute('id');
		awide.activeProject.settings[setting].value = inputs[i].value;
	}
	awide.projectOptions.close();
	var save = JSON.stringify(awide.activeProject.settings);	
	var settingsFile = new awide.File(awide.activeProject.path + "settings.awide", true);
	settingsFile.content = save;
	settingsFile.save(true);
}catch(e) { alert(e.message); }
};


awide.preferences = function () {
    'use strict';
    var prefWindow = window.openDialog("chrome://awide/content/awide-preferences.xul", "AwIDE Preferences", "chrome,titlebar,toolbar,centerscreen,dialog=yes");	
    prefWindow.awide = awide;
};

awide.selectTheme = function (theme) {
	var i;
	if(awide.activeProject) {
		for (i = 0; i < awide.activeProject.files.length; i++) {
			if(awide.activeProject.files[i].frame) {
				awide.activeProject.files[i].frame.tab.setTheme(theme);
			}
		}
	}
    awide.theme = theme;
};
awide.status = function (out, icon) {
    'use strict';
    /*var outputlist = document.getElementById("statusoutputlist"),
        item = outputlist.appendItem(out),
        img;
    if (icon) {
        img = document.createElement("image");
        img.setAttribute("src", icon);
        item.appendChild(img);
    }*/
    
    var outputlist = document.getElementById("statusoutputlist"),
        row = document.createElement("listitem"),
        cell = document.createElement("listcell"),
        img;
    if (icon) {
        img = document.createElement("image");
        img.setAttribute("src", icon);
        cell.appendChild(img);
    }
    row.appendChild(cell);
    cell = document.createElement("listcell");
    cell.setAttribute("label", out);
    row.appendChild(cell);
    outputlist.appendChild(row);    
};

awide.setFileStatus = function (status) {
    'use strict';
    var fileStatus = document.getElementById("statusbar_file");
    fileStatus.setAttribute("label", status);
};

awide.setPosStatus = function (coords) {
    'use strict';
    var posStatus = document.getElementById("statusbar_pos"),
		menuList = document.getElementById('methodlist'),
		i;
    posStatus.setAttribute("label", (coords.line - 1) + ", " + coords.ch);
    menuList.selectedIndex = 0;
    var file = awide.getCurrentFile();
    for (i = 0; i < file.index.length; i += 1) {
		if (coords.line >= file.index[i].start && coords.line <= file.index[i].end) {
			menuList.selectedIndex = i + 1;
			//awide.status("found you in " + file.index[i].fqdn);
			//return;
		}
	}
};

awide.clearDebug = function () {
	outputlist = document.getElementById("debugoutputlist");

	while (outputlist.itemCount > 0) {
		outputlist.removeItemAt(0);
	}		
};

awide.stackFunction = function (func, file, line) {
    'use strict';
    var olist = "stackoutputlist";
    var outputlist = document.getElementById(olist),
        row = document.createElement("listitem"),
        cell = document.createElement("listcell"),
        img;
    cell = document.createElement("listcell");
    cell.setAttribute("label", line || "*");
    row.appendChild(cell);
    cell = document.createElement("listcell");
    cell.setAttribute("label", func);
    row.appendChild(cell);
    cell = document.createElement("listcell");
    cell.setAttribute("label", file);
    row.appendChild(cell);
    outputlist.appendChild(row);
};

awide.debugError = function (error, icon) {
    'use strict';
    var olist = "debugoutputlist";
    var outputlist = document.getElementById(olist),
        row = document.createElement("listitem"),
        cell = document.createElement("listcell"),
        img;
    if (icon) {
        img = document.createElement("image");
        img.setAttribute("src", icon);
        cell.appendChild(img);
    }
    row.appendChild(cell);
    cell = document.createElement("listcell");
    cell.setAttribute("label", error.line || "*");
    row.appendChild(cell);
    cell = document.createElement("listcell");
    cell.setAttribute("label", error.character || "*");
    row.appendChild(cell);
    cell = document.createElement("listcell");
    cell.setAttribute("label", error.reason);
    row.appendChild(cell);
    cell = document.createElement("listcell");
    cell.setAttribute("value", error.file);
    cell.setAttribute("label", error.file.substr(error.file.lastIndexOf("/") + 1));
    row.appendChild(cell);    
    outputlist.appendChild(row);

};

awide.error = function (error, icon, list) {
    'use strict';
    var olist = list || "erroroutputlist";
    var outputlist = document.getElementById(olist),
        row = document.createElement("listitem"),
        cell = document.createElement("listcell"),
        img;
    if (icon) {
        img = document.createElement("image");
        img.setAttribute("src", icon);
        cell.appendChild(img);
    }
    row.appendChild(cell);
    cell = document.createElement("listcell");
    cell.setAttribute("label", error.line || "*");
    row.appendChild(cell);
    cell = document.createElement("listcell");
    cell.setAttribute("label", error.character || "*");
    row.appendChild(cell);
    cell = document.createElement("listcell");
    cell.setAttribute("label", error.reason);
    row.appendChild(cell);
    outputlist.appendChild(row);

};
awide.clearSearch = function () {
	var	outputlist = document.getElementById("searchoutputlist");
	while (outputlist.itemCount > 0) {
		outputlist.removeItemAt(0);
	}	
};

awide.clearSearchResults = function () {
	awide.clearSearch();
	awide.getCurrentFile().frame.tab.clearSearch();	
};

awide.matchSearchResult = function (event) {
    'use strict';
    var searchList = document.getElementById("searchoutputlist"),
        selectedItem = searchList.selectedItem,
        cells = selectedItem.getElementsByTagName("listcell"),
        line = cells[0].getAttribute("label"),
        ch = cells[1].getAttribute("label"),      
        file = awide.getCurrentFile();
    if(ch == "*") {
		 ch = 0;
	}
    file.frame.lineIndicator({line: line, ch: ch}, true);
};

awide.searchResult = function (result) {
    'use strict';
    var outputlist = document.getElementById("searchoutputlist"),
        row = document.createElement("listitem"),
        cell = document.createElement("listcell"),
        img;    
    cell = document.createElement("listcell");
    cell.setAttribute("label", result.line || "*");
    row.appendChild(cell);
    cell = document.createElement("listcell");
    cell.setAttribute("label", result.character || "*");
    row.appendChild(cell);
    cell = document.createElement("listcell");
    cell.setAttribute("label", result.message);
    row.appendChild(cell);
    outputlist.appendChild(row);
};

awide.runCurrentProject = function () {
    'use strict';
    /*var runcommand = "d:\\projects\\xulrunner10\\xulrunner.exe ",
        process = Components.classes["@mozilla.org/process/util;1"].createInstance(Components.interfaces.nsIProcess),
        localFile = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile),
        observer = new awide.processObserver();
    localFile.initWithPath(runcommand);
    process.init(localFile);
    process.runAsync([awide.activeProject.runpath, "-console"], 2, observer);*/
	awide.clearDebug();
    awide.activeProject.run();
};

awide.getCurrentFile = function () {
    'use strict';
    var currentTab = document.getElementById("editortabs").selectedItem,
        currentFile = null;
    if (currentTab) {
        currentFile = currentTab.getAttribute("value").split("|")[1];
        return awide.getFile(currentFile);
	}
    return null;
};

awide.undo = function () {
    'use strict';
    /*var currentTab = document.getElementById("editortabs").selectedItem,
        currentFile = currentTab.getAttribute("value"),
        file = awide.getFile(currentFile);*/
	awide.getCurrentFile().frame.tab.editor.undo();
};

awide.redo = function () {
    'use strict';
    /*var currentTab = document.getElementById("editortabs").selectedItem,
        currentFile = currentTab.getAttribute("value"),
        file = awide.getFile(currentFile);*/
	awide.getCurrentFile().frame.tab.editor.redo();
};

awide.saveCurrentFile = function () {
    'use strict';
    var currentTab = document.getElementById("editortabs").selectedItem,        
        label = currentTab.getAttribute("label"),
        file = awide.getCurrentFile(),
        errors,
        outputlist,
        i;
    file.save();
    label = label.replace("*", "");
    currentTab.setAttribute("label", label);
    awide.validateFile(file);
    //awide.activeProject.rescan(file);
    //awide.addToTree(awide.activeProject);
};

awide.setErrorList = function (file) {
	var errors = file.errors,
		outputtabs = document.getElementById('statustabs'),
		outputlist = document.getElementById("erroroutputlist");

	while (outputlist.itemCount > 0) {
		outputlist.removeItemAt(0);
	}		
    if (errors.length > 0) {
		if (!awide.activeProject.isRunning) {
			outputtabs.selectedIndex = 1;
		}
        for (i = 0; i < errors.length; i += 1) {
            if (errors[i] !== null) {
                awide.error(errors[i], errors[i].type || awide.WARNING);
            } else {
                awide.error({reason: "Scan interrupted.", line: "*", character: "*"}, awide.ERROR);
            }
        }
    } else {
		awide.error({reason: "No errors to report.", line: "*", character: "*"}, awide.INFO);
	}
};

awide.validateFile = function (file) {
    'use strict';
    var errors,
		index,
        outputlist,                
        i;
    errors = file.frame.tab.validate();
    if(errors){
		file.errors = errors;
		awide.setErrorList(file);		
	}
	if (file.type) {
		file.index = file.type.index(file.content);
	}
    awide.fillFunctionList(file);
};
awide.tabChanged = function () {
	var file = awide.getCurrentFile();
	if(file){
		awide.fillFunctionList(file);
		if(file.errors){
			awide.setErrorList(file);
		}          
		if(file.frame){
			file.frame.hideIndicator();
		}
	}
};

awide.methodChanged = function () {
	var methodList = document.getElementById("methodlist"),
		methodLine = parseInt(methodList.selectedItem.getAttribute("value")),
		file = awide.getCurrentFile();
	if (file && methodLine !== 0) {
		file.frame.lineIndicator({ line: methodLine, ch: 0 }, true);	
	}
};

awide.fillFunctionList = function(file) {
	var menuList = document.getElementById('methodpopup'),	    
		funcItem,
        i;
	while(menuList.firstChild){
		menuList.removeChild(menuList.firstChild);
	}
    if (file.index.length > 0) {
		funcItem = document.createElement("menuitem"); //<menuitem label="-method-" value="1"/>
		funcItem.setAttribute("label", "global");
		funcItem.setAttribute("value", 0);
		menuList.appendChild(funcItem);
		
		for (i = 0; i < file.index.length; i++) {
			funcItem = document.createElement("menuitem"); //<menuitem label="-method-" value="1"/>
			funcItem.setAttribute("label", file.index[i].fqdn);
			funcItem.setAttribute("value", file.index[i].start);
			menuList.appendChild(funcItem);
		}
		menuList = document.getElementById("methodlist");
		menuList.selectedIndex = 0;
	}
};

awide.ini2object = function (ini) {
    'use strict';
    var obj = {},
        currentSection = "root",
        keyval = "",
        lines = ini.split("\n"),
        i;
    for (i = 0; i < lines.length; i += 1) {
        if (lines[i].length > 0) {
            if (lines[i][0] === "[") {
                currentSection = lines[i].substring(1, lines[i].indexOf("]"));
                obj[currentSection] = {};
            } else if (lines[i].indexOf("=") !== -1) {
                keyval = lines[i].split("=");
                obj[currentSection][keyval[0]] = keyval[1];
            }
        }
    }
    return obj;
};


awide.fixSlashes = function (filename) {
    'use strict';
    if (awide.OS.indexOf("WIN") !== -1) {
        filename = filename.replace(/\//g, "\\");
    } else {
        filename = filename.replace(/\\/g, "/");
        filename = filename.replace(/\/\//g, "/");
    }
    return filename;
};


awide.getFile = function (fullpath) {
    'use strict';
    var i;
    for (i = 0; i < awide.activeProject.files.length; i += 1) {
        if (awide.activeProject.files[i].fullpath === fullpath) {
            return awide.activeProject.files[i];
        }
    }
};

awide.markUnsaved = function (file) {
    'use strict';
    var tabs = document.getElementById("editortabs"),
        tablist = tabs.getElementsByTagName("tab"),
        label,
        i;
    file.hasChanges = true;
    file.frame.hideIndicator();
    for (i = 0; i < tablist.length; i += 1) {
        if (tablist[i].getAttribute("value").split("|")[1] === file.fullpath) {
            label = tablist[i].getAttribute("label");
            if (label.indexOf("*") === -1) {
                tablist[i].setAttribute("label", label + "*");
            }
            return;
        }
    }
};

awide.selectTab = function (file) {
    'use strict';
    var tabs = document.getElementById("editortabs"),
        tablist = tabs.getElementsByTagName("tab"),
        i;
	//set window title to file.fullpath
	document.title = "[" + awide.activeProject.name + "] " + file.fullpath;
    for (i = 0; i < tablist.length; i += 1) {
        if (tablist[i].getAttribute("value").split("|")[1] === file.fullpath) {
            tabs.selectedItem = tablist[i];
			awide.hideInactive();  
            return;
        }
    }
    awide.createTab(file);
};

/*
awide.closeTab = function (path) {
    var tabs = document.getElementById("editortabs"),
        tablist = tabs.getElementsByTagName("tab");
    for(var i = 0; i < tablist.length; i++){
        if(tablist[i].getAttribute("value") == path){
            tabs.removeItemAt(i * 2); // remove tab
            tabs.removeItemAt(i * 2); // remove close button 
            return;
        }
    }   
};*/

awide.createTab = function (file) {
    'use strict';
    var tabs = document.getElementById("editortabs"),
        panels = document.getElementById("editorpanels"),
        newpanel = document.createElement("tabpanel"),
        tabframe = document.createElement("iframe"),
		tabcount = tabs.getElementsByTagName("tab").length,
        newtab = tabs.appendItem(file.name, awide.activeProject.name + "|" + file.fullpath);
	newtab.addEventListener("dblclick", function () { awide.closeTab(newtab); }, true);
    tabframe.setAttribute("src", "chrome://awide/content/main.html");
    tabframe.setAttribute("id", file.name.replace(".", "_"));
    tabframe.setAttribute("type", "chrome");
    tabframe.setAttribute("flex", "1");
    tabframe.addEventListener("DOMContentLoaded", function () {
        tabframe.contentWindow.top.awide = awide;
        tabframe.contentWindow.top.project = awide.activeProject;
        tabframe.contentWindow.showTab(file);
        file.frame = tabframe.contentWindow;
        awide.validateFile(file);        
    });
    newpanel.appendChild(tabframe);
    panels.appendChild(newpanel);
    tabs.selectedItem = newtab;  
    awide.hideInactive();  
};

awide.hideInactive = function () {
    'use strict';
    var tabs = document.getElementById("editortabs"),
        tablist = tabs.getElementsByTagName("tab"),
        label,
        i;
    for (i = 0; i < tablist.length; i += 1) {
		var a = tablist[i].getAttribute("value");
		var b = a.split("|");
		var c = b[0];
        if (tablist[i].getAttribute("value").split("|")[0] === awide.activeProject.name) {
			tablist[i].hidden = false;
        } else {
			tablist[i].hidden = true;
		}			
    }	
};

awide.hideLibElements = function(/* bool */ hide) {
	var projectLevel = document.getElementById("projectlevel");
	var children = projectLevel.getElementsByTagName("treeitem");
    var i = 0;
	for(i = 0; i < children.length; i++) {
		if(children[i].getAttribute("lib") == "true") { 
			children[i].hidden = hide;
		}
	}
};
awide.addToTree = function (project) {
    'use strict';
    var projectLevel = document.getElementById("projectlevel"),
        treeitem = document.createElement("treeitem"),
        treerow = document.createElement("treerow"),
        treecell = document.createElement("treecell"),
        treechildren = document.createElement("treechildren"),
        pathitem = document.createElement("treeitem"),
        pathrow = document.createElement("treerow"),
        pathcell = document.createElement("treecell"),
        pathchildren = document.createElement("treechildren"),
        fileitem = document.createElement("treeitem"),
        filerow = document.createElement("treerow"),
        filecell = document.createElement("treecell"),
        olditem = document.getElementById(project.name),
        files = {},
        exists = false,
        shortpath,
        i,
        f;
	if(olditem){
		projectLevel.removeChild(olditem);
	}
    for (i = 0; i < project.files.length; i += 1) {
        shortpath = awide.fixSlashes(project.files[i].path.replace(project.path, ""));
        shortpath = shortpath.substring(0, shortpath.length - 1);
        if (!files[shortpath]) {
            files[shortpath] = [];
        }
        for (f = 0; f < files[shortpath].length; f += 1) {
            if (files[shortpath][f].fullpath === project.files[i].fullpath) {
                exists = true;
            }
        }
        if (!exists) {
			//dump(shortpath + " : " + project.files[i].name + "\n");
            files[shortpath].push(project.files[i]);
        }
    }
    treecell.setAttribute("label", project.name);
    treecell.setAttribute("value", "projectgroup");
    treeitem.setAttribute("id", project.name);
    treeitem.setAttribute("container", "true");
    treeitem.setAttribute("open", "true");
    treerow.appendChild(treecell);
    treeitem.appendChild(treerow);
    treeitem.appendChild(treechildren);
    projectLevel.appendChild(treeitem); 	
    for (shortpath in files) {
		//awide.status("|" + shortpath + "|");
        if (files.hasOwnProperty(shortpath)) {
			if(shortpath != ""){
			pathitem = document.createElement("treeitem");
			pathrow = document.createElement("treerow");
			pathcell = document.createElement("treecell");
			pathchildren = document.createElement("treechildren");
            pathcell.setAttribute("label", shortpath);
            pathcell.setAttribute("value", "pathgroup" + "|" + shortpath);
            pathitem.setAttribute("container", "true");
            pathitem.setAttribute("open", "true");
            pathitem.setAttribute("lib", "false");
            if(shortpath.indexOf("lib") !== -1) {
				pathitem.setAttribute("lib", "true");
				pathitem.hidden = awide.hidelib;
			} else {
				pathitem.setAttribute("lib", "false");
			}			
            pathrow.appendChild(pathcell);
            pathitem.appendChild(pathrow);
            pathitem.appendChild(pathchildren);
            treechildren.appendChild(pathitem);
			}
            for (i = 0; i < files[shortpath].length; i += 1) {
				fileitem = document.createElement("treeitem");
				filerow = document.createElement("treerow");
				filecell = document.createElement("treecell");
                filecell.setAttribute("value", project.name + "|" + files[shortpath][i].fullpath);
                filecell.setAttribute("project", project.name);
                filecell.setAttribute("label", files[shortpath][i].name);                
                filerow.appendChild(filecell);
                fileitem.appendChild(filerow);
                if(shortpath != "") {
					pathchildren.appendChild(fileitem);
				} else {
					treechildren.appendChild(fileitem);
				}
            }
        }
    }
    //awide.hideLibElements(awide.hideLib)
};

awide.openProject = function (file) {
    'use strict';
    var project,
		loader,
		projectLoader = null;

		for(loader in awide.projectLoaders){			
            if(awide.projectLoaders.hasOwnProperty(loader)){
                if(awide.projectLoaders[loader].isCompatible(file)){
                    projectLoader = awide.projectLoaders[loader];
                }
            }
		}
	    
	if (projectLoader) {
		project = new projectLoader.Project(file);
        awide.projects[project.name] = project;
        awide.addToTree(project);
        awide.activeProject = project;
        var settings = new awide.File(project.path + "settings.awide");
        if (settings && settings.content) {
			awide.activeProject.settings = JSON.parse(settings.content);
		}
	} else {
		awide.status("Cannot open project: unknown project type(" + file.name + ")");
	}
};

awide.matchStackTrace = function (event) {
    'use strict';
    var errorList = document.getElementById("stackoutputlist"),
		tabs = document.getElementById("editortabs"),
        selectedItem = errorList.selectedItem,
        cells = selectedItem.getElementsByTagName("listcell"),
        line = cells[0].getAttribute("label") - 1,        
        fileName = cells[2].getAttribute("label"),
        file = null;
    if(fileName != "") {
		file = awide.fileIn(new awide.File(fileName), awide.activeProject.files);
	} else {
		return;
	}
    awide.selectTab(file);
    if(file.frame && line != "*"){
		file.frame.lineIndicator({line: line, ch: 0}, true);
	} else {
		var tabframe = document.getElementById(file.name.replace(".", "_"));
		tabframe.addEventListener("DOMContentLoaded", function () {
			tabframe.contentWindow.lineIndicator({line: line, ch: 0}, true);
		});
	}	
};

awide.matchDebugError = function (event) {
    'use strict';
    var errorList = document.getElementById("debugoutputlist"),
		tabs = document.getElementById("editortabs"),
        selectedItem = errorList.selectedItem,
        cells = selectedItem.getElementsByTagName("listcell"),
        line = cells[1].getAttribute("label") - 1,
        ch = cells[2].getAttribute("label"),
        fileName = cells[4].getAttribute("value"),
        file = null;
    if(fileName != "") {
		file = awide.fileIn(new awide.File(fileName), awide.activeProject.files);
	} else {
		return;
	}
    awide.selectTab(file);
    //file = awide.getCurrentFile();
    if(file.frame && line != "*"){
		file.frame.lineIndicator({line: line, ch: 0}, true);
	} else {
		var tabframe = document.getElementById(file.name.replace(".", "_"));
		tabframe.addEventListener("DOMContentLoaded", function () {
			tabframe.contentWindow.lineIndicator({line: line, ch: 0}, true);
		});
	}	
};

awide.matchError = function (event) {
    'use strict';
    var errorList = document.getElementById("erroroutputlist"),
        selectedItem = errorList.selectedItem,
        cells = selectedItem.getElementsByTagName("listcell"),
        line = cells[1].getAttribute("label"),
        ch = cells[2].getAttribute("label"),      
        file = awide.getCurrentFile();
    file.frame.lineIndicator({line: line, ch: ch});
        //file.frame.focus();
        //file.frame.tab.editor.focus();
};

awide.closeTab = function (letab) {
    var tabs = document.getElementById("editortabs"),
		tabpanels = document.getElementById("editorpanels"),
        panellist = tabpanels.getElementsByTagName("tabpanel"),
		index = tabs.getIndexOfItem(letab),
        i;
	
	tabs.removeItemAt(index);
	tabpanels.removeChild(panellist[index]);	
};

awide.projectContextRemove = function () {
    var tabs = document.getElementById("editortabs"),
        tablist = tabs.getElementsByTagName("tab"),
        i;

	awide.status("Removing " + awide.contextCell.path + "...", awide.INFO);	
	for(i = 0; i < awide.activeProject.files.length; i++){
		if(awide.activeProject.files[i].fullpath === awide.contextCell.path){
			awide.activeProject.files[i].delete();
			awide.activeProject.files.splice(i, 1);
			break;
		}
	}
    for (i = 0; i < tablist.length; i += 1) {
        if (tablist[i].getAttribute("value").split("|")[1] === awide.contextCell.path) {
            //tabs.selectedItem = tablist[i];
            tabs.advanceSelectedTab(1, true);
            //tabs.removeItemAt(i);
            awide.closeTab(i);
            break;
        }
    }
    awide.activeProject.rescan();
    awide.addToTree(awide.activeProject);
};
awide.treeClicked = function (event) {
    'use strict';
    var tree = document.getElementById("projecttree"),
        tbo = tree.treeBoxObject,
        row = { },
        col = { },
        child = { },
        i,
        cellValue,
        cellValues;
    tbo.getCellAt(event.clientX, event.clientY, row, col, child);
    try {
		cellValue = tree.view.getCellValue(row.value, col.value);
		cellValues = cellValue.split("|");
		awide.contextCell = { type: cellValues[0], path: cellValues[1] };
		if (cellValues[0].indexOf("group") === -1) {
			awide.activeProject = awide.projects[cellValues[0]];
		}	
	} catch(e) { awide.status(e.message, awide.ERROR); }
    if(cellValue && cellValue.indexOf("group") === -1){
		for (i = 0; i < awide.activeProject.files.length; i += 1) {
			if (awide.activeProject.files[i].fullpath === cellValues[1]) {
				awide.selectTab(awide.activeProject.files[i]);
				awide.$fireEvent("load", awide.activeProject.files[i]);
				break;
			}
		}
	}
	
	switch (cellValues[0]) {
	case "projectgroup":
		document.getElementById("project-actions-close").hidden = false;
		document.getElementById("project-actions-remove").hidden = true;
		document.getElementById("project-actions-add").hidden = false;
		break;
	case "pathgroup":
		document.getElementById("project-actions-close").hidden = true;
		document.getElementById("project-actions-remove").hidden = false;
		document.getElementById("project-actions-add").hidden = false;
		break;
	default:
		document.getElementById("project-actions-close").hidden = true;
		document.getElementById("project-actions-remove").hidden = false;
		document.getElementById("project-actions-add").hidden = true;	
		break;
	}
};

awide.openFileDialog = function () {
    'use strict';
    var Components = top.Components,
        nsIFilePicker = Components.interfaces.nsIFilePicker,
        file,
        fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
    fp.init(window, "Select a File", nsIFilePicker.modeOpen);
    if (fp.show() === nsIFilePicker.returnOK) {
        file = new awide.File(fp.file.path);
        
        //awide.$fireEvent("load-project", file);
        awide.openProject(file);
    }
};

awide.openFileSaveDialog = function () {
    'use strict';
    var Components = top.Components,
        nsIFilePicker = Components.interfaces.nsIFilePicker,
        dirpath = Components.classes["@mozilla.org/file/local;1"].createInstance(Components.interfaces.nsILocalFile),
        file,
        fp = Components.classes["@mozilla.org/filepicker;1"].createInstance(nsIFilePicker);
    fp.init(window, "Create a File", nsIFilePicker.modeSave);
     
    if (awide.contextCell.type === "pathgroup") {
		dirpath.initWithPath(awide.fixSlashes(awide.activeProject.path + awide.contextCell.path));
		fp.displayDirectory = dirpath;
	} else {
		dirpath.initWithPath(awide.activeProject.path);
		fp.displayDirectory = dirpath;
	}
    if (fp.show() === nsIFilePicker.returnOK) {
		//awide.status(fp.file.path, awide.INFO);
        awide.activeProject.files.push(new awide.File(fp.file.path, true));
		awide.activeProject.rescan();
		awide.addToTree(awide.activeProject);        
        //awide.$fireEvent("load-project", file);
        //awide.openProject(file);
    }
};

awide.findFiles = function (dir, typeregex) {
	var root = new awide.Directory(dir);
	var files = root.getFiles();
	var sourceFiles = [];
	var typeMatcher = typeregex || new RegExp('\.(js|css|xul|html|xml|ini)');
    var i;
	for(i = 0; i < files.length; i++) {
		if (files[i].exists() && files[i].leafName !== "CVS" && files[i].leafName !== ".svn") {			
			if (files[i].isDirectory()) {
				sourceFiles = sourceFiles.concat(awide.findFiles(files[i], typeMatcher));
			} else {
				if(typeMatcher.exec(files[i].leafName)) {
					sourceFiles.push(new awide.File(files[i]));
				}
			}			
		}				
	}
	sourceFiles.sort( function (a, b) { 
		if(a.name < b.name) return -1;
		if(a.name > b.name) return 1;
		return 0;
	});
	return sourceFiles;	
};

awide.toggleSearch = function () {
	var searchbox = document.getElementById("searchbox");
	var hidden = searchbox.hidden;
	searchbox.hidden = !hidden;
};

awide.search = function (key) {
	//awide.status(key, awide.INFO);
	var file = awide.getCurrentFile();
	file.frame.tab.find(key);
};

awide.dechrome = function (path, base) {
	var re = new RegExp("chrome:\/\/.*?\/(.*)"),
		matches = re.exec(path);
	return awide.fixSlashes(base + "chrome\\" + matches[1]);
};

awide.fileIn = function (file, collection) {
	var i;
	for(i = 0; i < collection.length; i++) {
		awide.status(file.fullpath + " == " + collection[i].fullpath, awide.INFO);
		if(file.fullpath === collection[i].fullpath) {
			return collection[i];
		}
	}
	return null;
};

awide.rescan = function (path, files, typematch) {
	var scanned_files = awide.findFiles(awide.fixSlashes(path), typematch),
		file_box = [],
		from_box = null,
		i;
	for(i = 0; i < scanned_files.length; i++){			
		from_box = this.fileIn(scanned_files[i], files);
		if(from_box) {
			file_box.push(from_box);
		} else {
			file_box.push(scanned_files[i]);
		}				
	}
	return file_box;
};
	
awide.reloadPrefs = function () {
	awide.csslint_options = {};
	awide.theme = awide.prefManager.getCharPref("awide.preferences.theme");	
	awide.hidelib = awide.prefManager.getBoolPref("awide.preferences.hidelib");
	awide.jslint_options.anon = awide.prefManager.getBoolPref("awide.jslint.anon");
	awide.jslint_options.bitwise = awide.prefManager.getBoolPref("awide.jslint.bitwise");
	awide.jslint_options.cap = awide.prefManager.getBoolPref("awide.jslint.cap");
	awide.jslint_options.confusion = awide.prefManager.getBoolPref("awide.jslint.confusion");
	awide.jslint_options.continue = awide.prefManager.getBoolPref("awide.jslint.continue");
	awide.jslint_options.css = awide.prefManager.getBoolPref("awide.jslint.css");
	awide.jslint_options.debug = awide.prefManager.getBoolPref("awide.jslint.debug");
	awide.jslint_options.devel = awide.prefManager.getBoolPref("awide.jslint.devel");
	awide.jslint_options.eqeq = awide.prefManager.getBoolPref("awide.jslint.eqeq");
	awide.jslint_options.es5 = awide.prefManager.getBoolPref("awide.jslint.es5");
	awide.jslint_options.evil = awide.prefManager.getBoolPref("awide.jslint.evil");
	awide.jslint_options.forin = awide.prefManager.getBoolPref("awide.jslint.forin");
	awide.jslint_options.fragment = awide.prefManager.getBoolPref("awide.jslint.fragment");
	awide.jslint_options.newcap = awide.prefManager.getBoolPref("awide.jslint.newcap");
	awide.jslint_options.node = awide.prefManager.getBoolPref("awide.jslint.node");
	awide.jslint_options.nomen = awide.prefManager.getBoolPref("awide.jslint.nomen");
	awide.jslint_options.on = awide.prefManager.getBoolPref("awide.jslint.on");
	awide.jslint_options.passfail = awide.prefManager.getBoolPref("awide.jslint.passfail");
	awide.jslint_options.plusplus = awide.prefManager.getBoolPref("awide.jslint.plusplus");
	awide.jslint_options.properties = awide.prefManager.getBoolPref("awide.jslint.properties");
	awide.jslint_options.regexp = awide.prefManager.getBoolPref("awide.jslint.regexp");
	awide.jslint_options.rhino = awide.prefManager.getBoolPref("awide.jslint.rhino");
	awide.jslint_options.undef = awide.prefManager.getBoolPref("awide.jslint.undef");
	awide.jslint_options.unparam = awide.prefManager.getBoolPref("awide.jslint.unparam");
	awide.jslint_options.sloppy = awide.prefManager.getBoolPref("awide.jslint.sloppy");
	awide.jslint_options.sub = awide.prefManager.getBoolPref("awide.jslint.sub");
	awide.jslint_options.vars = awide.prefManager.getBoolPref("awide.jslint.vars");
	awide.jslint_options.white = awide.prefManager.getBoolPref("awide.jslint.white");
	awide.jslint_options.widget = awide.prefManager.getBoolPref("awide.jslint.widget");
	awide.jslint_options.windows = awide.prefManager.getBoolPref("awide.jslint.windows");	
	var css_rules = ['adjoining_classes', 'box_model', 'box_sizing', 'compatible_vendor_prefixes', 'display_property_grouping', 'duplicate_background_images', 'duplicate_properties', 'empty_rules', 'fallback_colors', 'floats', 'font_faces', 'font_sizes', 'gradients', 'ids', 'import', 'important', 'known_properties', 'outline_none', 'overqualified_elements', 'qualfied_headings', 'regex_selectors', 'shorthand', 'text_indent', 'unique_headings', 'universal_selector', 'vendor_prefix', 'zero_units'];
	
	for(i = 0; i < css_rules.length; i++) {
		if(awide.prefManager.getBoolPref("awide.csslint." + css_rules[i])) {
			awide.csslint_options[css_rules[i].replace("_", "-")] = 1;
		}
	}	
	awide.hideLibElements(awide.hidelib);
};

awide.replaceAll = function () {
	awide.findreplace = window.open("chrome://awide/content/replace.xul", "replaceall", "chrome,width=200,height=150,centerscreen");
	awide.findreplace.awide = awide;
};
awide.replaceAllInCurrent = function () {
	if(awide.findreplace) {
		var doc = awide.findreplace.document; //.contentWindow.document;
		text = 			doc.getElementById("findwhat").value;//getAttribute("value");
		replacewith = 	doc.getElementById("replacewith").value;//getAttribute("value");
		inselection = 	doc.getElementById("inselection").getAttribute("checked");		
		//alert("replacing " + text + " with " + replacewith + " in doc/sel: " + inselection);
		text = new RegExp(text, "g");
		awide.getCurrentFile().frame.tab.replaceAll(text, replacewith, inselection);
		awide.findreplace.close();
	}
};

window.addEventListener("load", function() {
	awide.reloadPrefs();
	awide.$getLoaders();
	awide.$getFileTypes();
  /*
    load a dll, then execute a function from it
	var lib = ctypes.open("d:\\projects\\awide_1\\chrome\\content\\dll\\awide_helper.dll");
	var cow = lib.declare("getCow", ctypes.default_abi, ctypes.char.ptr);
	var ret = cow();
	alert(ret.readString());
	lib.close();	
  */
});
