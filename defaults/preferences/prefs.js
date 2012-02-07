pref("toolkit.defaultChromeURI", "chrome://awide/content/main.xul");

/* awide preferences */
pref("awide.preferences.theme", "awide");
pref("awide.preferences.hidelib", false);
pref("webgl.force-enabled", true);
pref("webgl.disabled", false);
pref("webgl.disable-extensions", false);
pref("webgl.shader_validator", true);

/* awide jslint preferences (default: nothing is allowed) */
pref("awide.jslint.anon", false);
pref("awide.jslint.bitwise", false);
pref("awide.jslint.browser", false);
pref("awide.jslint.cap", false);
pref("awide.jslint.confusion", false);
pref("awide.jslint.continue", false);
pref("awide.jslint.css", false);
pref("awide.jslint.debug", false);
pref("awide.jslint.devel", false);
pref("awide.jslint.eqeq", false);
pref("awide.jslint.es5", false);
pref("awide.jslint.evil", false);
pref("awide.jslint.forin", false);
pref("awide.jslint.fragment", false);
pref("awide.jslint.newcap", false);
pref("awide.jslint.node", false);
pref("awide.jslint.nomen", false);
pref("awide.jslint.on", false);
pref("awide.jslint.passfail", false);
pref("awide.jslint.plusplus", false);
pref("awide.jslint.properties", false);
pref("awide.jslint.regexp", false);
pref("awide.jslint.rhino", false);
pref("awide.jslint.undef", false);
pref("awide.jslint.unparam", false);
pref("awide.jslint.sloppy", false);
pref("awide.jslint.sub", false);
pref("awide.jslint.vars", false);
pref("awide.jslint.white", false);
pref("awide.jslint.widget", false);
pref("awide.jslint.windows", false);

/* awide csslint preferences (default: disallow everything) */
pref('awide.csslint.adjoining_classes', true);
pref('awide.csslint.box_model', true);
pref('awide.csslint.box_sizing', true);
pref('awide.csslint.compatible_vendor_prefixes', true);
pref('awide.csslint.display_property_grouping', true);
pref('awide.csslint.duplicate_background_images', true);
pref('awide.csslint.duplicate_properties', true);
pref('awide.csslint.empty_rules', true);					
pref('awide.csslint.fallback_colors', true);
pref('awide.csslint.floats', true);
pref('awide.csslint.font_faces', true);
pref('awide.csslint.font_sizes', true);
pref('awide.csslint.gradients', true);
pref('awide.csslint.ids', true);		
pref('awide.csslint.import', true);
pref('awide.csslint.important', true);
pref('awide.csslint.known_properties', true);
pref('awide.csslint.outline_none', true);
pref('awide.csslint.overqualified_elements', true);
pref('awide.csslint.qualfied_headings', true);
pref('awide.csslint.regex_selectors', true);
pref('awide.csslint.shorthand', true);
pref('awide.csslint.text_indent', true);
pref('awide.csslint.unique_headings', true);
pref('awide.csslint.universal_selector', true);
pref('awide.csslint.vendor_prefix', true);
pref('awide.csslint.zero_units', true);

/* to ensure the preference dialog works properly */
pref("browser.preferences.instantApply", true);
pref("browser.preferences.animateFadeIn", false);
pref("browser.tabs.closeButtons", 1);

/* debugging prefs */
pref("browser.dom.window.dump.enabled", true);
pref("javascript.options.showInConsole", true);
pref("javascript.options.strict", true);
pref("nglayout.debug.disable_xul_cache", true);
pref("nglayout.debug.disable_xul_fastload", true);

/* extension manager prefs */

pref("xpinstall.dialog.confirm", "chrome://mozapps/content/xpinstall/xpinstallConfirm.xul");
pref("xpinstall.dialog.progress.skin", "chrome://mozapps/content/extensions/extensions.xul?type=themes");
pref("xpinstall.dialog.progress.chrome", "chrome://mozapps/content/extensions/extensions.xul?type=extensions");
pref("xpinstall.dialog.progress.type.skin", "Extension:Manager-themes");
pref("xpinstall.dialog.progress.type.chrome", "Extension:Manager-extensions");
pref("extensions.update.enabled", true);
pref("extensions.update.interval", 86400);
pref("extensions.dss.enabled", false);
pref("extensions.dss.switchPending", false);
pref("extensions.ignoreMTimeChanges", false);
pref("extensions.logging.enabled", false);
pref("general.skins.selectedSkin", "classic/1.0");
// NB these point at AMO
pref("extensions.update.url", "chrome://mozapps/locale/extensions/extensions.properties");
pref("extensions.getMoreExtensionsURL", "chrome://mozapps/locale/extensions/extensions.properties");
pref("extensions.getMoreThemesURL", "chrome://mozapps/locale/extensions/extensions.properties");
