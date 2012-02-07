CodeMirror.defineMode("nsis", function(cmCfg, modeCfg) {

  function switchState(source, setState, f) {
    setState(f);
    return f(source, setState);
  }
  
  // These should all be Unicode extended, as per the Haskell 2010 report
  var smallRE = /[a-z_]/;
  var largeRE = /[A-Z]/;
  var digitRE = /[0-9]/;
  var hexitRE = /[0-9A-Fa-f]/;
  var octitRE = /[0-7]/;
  var idRE = /[a-z_A-Z0-9']/;
  var symbolRE = /[!$;]/;
  var specialRE = /[(),[\]`{}]/;
  var whiteCharRE = /[ \t\v\f]/; // newlines are handled in tokenizer
    
  function normal(source, setState) {
    if (source.eatWhile(whiteCharRE)) {
      return null;
    }
      
    var ch = source.next();
    if (specialRE.test(ch)) {
      if (ch == '/' && source.eat('*')) {
        var t = "comment";
        return switchState(source, setState, ncomment(t, 1));
      }
      return null;
    }
    
    if (ch == '\'') {
      if (source.eat('\\')) {
        source.next();  // should handle other escapes here
      }
      else {
        source.next();
      }
      if (source.eat('\'')) {
        return "string";
      }
      return "error";
    }
    
    if (ch == '"' || ch == "'") {
      return switchState(source, setState, stringLiteral);
    }
      
    if (largeRE.test(ch)) {
      source.eatWhile(idRE);
      if (source.eat('.')) {
        return "qualifier";
      }
      return "variable-2";
    }
      
    if (smallRE.test(ch)) {
      source.eatWhile(idRE);
      return "variable";
    }
      
    if (digitRE.test(ch)) {
      if (ch == '0') {
        if (source.eat(/[xX]/)) {
          source.eatWhile(hexitRE); // should require at least 1
          return "integer";
        }
        if (source.eat(/[oO]/)) {
          source.eatWhile(octitRE); // should require at least 1
          return "number";
        }
      }
      source.eatWhile(digitRE);
      var t = "number";
      if (source.eat('.')) {
        t = "number";
        source.eatWhile(digitRE); // should require at least 1
      }
      if (source.eat(/[eE]/)) {
        t = "number";
        source.eat(/[-+]/);
        source.eatWhile(digitRE); // should require at least 1
      }
      return t;
    }
      
    if (symbolRE.test(ch)) {
      if (ch == ';') {
		source.skipToEnd();
        return "comment";        
      }
      if (ch == '!') {
		  source.eatWhile(/\w/);
		  return "builtin";
	  }
      var t = "variable";
      if (ch == ':') {
        t = "variable-2";
      }
      source.eatWhile(/(\w|{|})/);//(symbolRE);
      return t;    
    }
      
    return "error";
  }
    
  function ncomment(type, nest) {
    if (nest == 0) {
      return normal;
    }
    return function(source, setState) {
      var currNest = nest;
      while (!source.eol()) {
        var ch = source.next();
        if (ch == '/' && source.eat('*')) {
          ++currNest;
        }
        else if (ch == '*' && source.eat('/')) {
          --currNest;
          if (currNest == 0) {
            setState(normal);
            return type;
          }
        }
      }
      setState(ncomment(type, currNest));
      return type;
    }
  }
    
  function stringLiteral(source, setState) {
    while (!source.eol()) {
      var ch = source.next();
      if (ch == '"' || ch == "'") {
        setState(normal);
        return "string";
      }
      if (ch == "$") {
		source.eatWhile(/(\w|{|})/);
		return "variable-2";
	  }
      /*if (ch == '\\') {
        if (source.eol() || source.eat(whiteCharRE)) {
          setState(stringGap);
          return "string";
        }
        if (source.eat('&')) {
        }
        else {
          source.next(); // should handle other escapes here
        }
      }*/
    }
    setState(normal);
    return "error";
  }
  
  function stringGap(source, setState) {
    /*if (source.eat('\\')) {
      return switchState(source, setState, stringLiteral);
    }*/
    source.next();
    setState(normal);
    return "error";
  }
  
  
  var wellKnownWords = (function() {
    var wkw = {};
    function setType(t) {
      return function () {
        for (var i = 0; i < arguments.length; i++)
          wkw[arguments[i]] = t;
      }
    }
    
    setType("keyword")(
      "function", "functionend", "pop", "push", "exch", "call", "file", "execshell",
      "section", "sectionend", "var");
      
    //setType("keyword")(
    //  "$", "!", "::", "=", "\\", "\"", "<-", "->", "@", "~", "=>");
      
    setType("builtin")(
      "!!", "&&", "+", "++", "-", ".", "/", "/=", "<", "<=", "=<<",
      "==", ">", ">=", ">>", ">>=", "^", "^^", "||", "*", "**");
      
    setType("keyword")(
      "writeregstr", "deleteregkey", "createshortcut", "name", "outfile", "installdir", "installdirregkey", "requestexecutionlevel",
      "viproductversion", "viaddversionkey", "fileopen", "filewrite", "fileclose");      
      
    return wkw;
  })();
    
  
  
  return {
    startState: function ()  { return { f: normal }; },
    copyState:  function (s) { return { f: s.f }; },
    
    token: function(stream, state) {
      var t = state.f(stream, function(s) { state.f = s; });
      var w = stream.current();
      return (w.toLowerCase() in wellKnownWords) ? wellKnownWords[w.toLowerCase()] : t;
    }
  };

});

