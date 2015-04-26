/**
 * Copyright (c) 2015 Marcelo Camargo <marcelocamargo@linuxmail.org>
 *
 * Permission is hereby granted, free of charge, to any person
 * obtaining a copy of this software and associated documentation files
 * (the "Software"), to deal in the Software without restriction,
 * including without limitation the rights to use, copy, modify, merge,
 * publish, distribute, sublicense, and/or sell copies of the Software,
 * and to permit persons to whom the Software is furnished to do so,
 * subject to the following conditions:
 *
 * The above copyright notice and this permission notice shall be
 * included in all copies or substantial of portions the Software.
 *
 * THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND,
 * EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF
 * MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND
 * NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE
 * LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION
 * OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION
 * WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.
 */

(function() {
  "use strict";
  var globalScope = 0;

  /**
   * Helpers and utilities
   */
  var ident = function(value) {
    var whitespace = "";
    for (var i = 0; i < globalScope * 2; i++)
      whitespace += T_WHITESPACE(value);
    return whitespace;
  }

  var eachIndex = function(fn) {
    return function(list) {
      for (var i = 0; i < list.length; i++)
        fn(i, list[i]);
    }
  }

  var eachObjectIndex = function(fn) {
    return function(obj) {
      for (var key in obj)
        fn(key, obj[key]);
    }
  }

  /**
   * Code generation for each terminal symbol.
   */
  var T_KEYWORD = function(value) {
    return "<span class='keyword'>" + value + "</span>";
  };

  var T_OTHER = function(value) {
    return "<span class='other'>" + value + "</span>";
  };

  var T_BREAKLINE = function() { return "<br />"; };

  var T_STRING = function(value) {
    return "<span class='string'>\"" + value + "\"</span>";
  };

  var T_NUMBER = function(value) {
    return "<span class='number'>" + value + "</span>";
  };

  var T_UNDEFINED = function(value) {
    return "<span class='undefined'>" + value + "</span>";
  };

  var T_BOOLEAN = function(value) {
    return "<span class='boolean'>" + (value ? "true" : "false") + "</span>";
  };

  var T_UNKNOWN = function(value) {
    return "<span class='unknown'>" + value + "</span>";
  };

  var T_NULL = function(value) {
    return "<span class='null'>" + value + "</span>";
  };

  var T_WHITESPACE = function() {
    return "<span class='whitespace'>&nbsp;</span>";
  };

  var T_OPERATOR = function(value) {
    return "<span class='operator'>" + value + "</span>";
  };

  var T_FUNCTION = function(value) {
    return "<span class='function'>" + value + "</span>";
  };

  /**
   * Terminal symbols.
   */
  var string = function(value) {
    return T_KEYWORD("string") 
         + T_OTHER("<") 
         + T_NUMBER(value.length) 
         + T_OTHER(">")
         + T_OTHER("(")
         + T_STRING(value)
         + T_OTHER(")")
         + T_BREAKLINE();
  };

  var number = function(value) {
    return T_KEYWORD("number")
         + T_OTHER("(")
         + T_NUMBER(value)
         + T_OTHER(")")
         + T_BREAKLINE();
  };

  var unknown = function(value) {
    return T_KEYWORD("unknown")
         + T_UNKNOWN(typeof value)
         + T_BREAKLINE();
  };

  var _undefined = function() {
    return T_UNDEFINED("undefined")
         + T_BREAKLINE();
  };

  var _boolean = function(value) {
    return T_KEYWORD("boolean")
         + T_OTHER("(")
         + T_BOOLEAN(value)
         + T_OTHER(")")
         + T_BREAKLINE();
  }

  var _null = function() {
    return T_NULL("null")
         + T_BREAKLINE();
  };

  var _function = function(value) {
    var template = T_KEYWORD("function")
                 + T_OTHER("(")
                 + T_BREAKLINE();

    globalScope++;

    template += ident()
              + T_FUNCTION(value.toString())
              + T_BREAKLINE();

    globalScope--;
    template += ident()
              + T_OTHER(")")
              + T_BREAKLINE();
    return template;
  }

  /**
   * Non terminal symbols.
   */
  var expr = function(value) {
    switch (typeof value) {
      case "string":
        return string(value);
      case "number":
        return number(value);
      case "undefined":
        return _undefined();
      case "boolean":
        return _boolean(value);
      case "function":
        return _function(value);
      default:
        if (Array.isArray(value)) { // Match array.
          return array(value);
        } else if (value === null) { // Match null.
          return _null();
        } else if (typeof value === "object") // Match object.
          return object(value);
        /* Edge case */
        return unknown(value);
    }
  };

  var array = function(value) {
    var template = T_KEYWORD("array")
                 + T_OTHER("<")
                 + T_NUMBER(value.length)
                 + T_OTHER(">")
                 + T_OTHER("(");

    // Inline-property when empty.
    var empty = value.length === 0;
    if (!empty) template += T_BREAKLINE();

    globalScope++;

    eachIndex(function(index, symbol) {
      template += ident()
                + T_OTHER("[")
                + T_NUMBER(index)
                + T_OTHER("]")
                + T_WHITESPACE()
                + T_OPERATOR("=>")
                + T_WHITESPACE()
                + expr(symbol);
    })(value);

    globalScope--;
    if (!empty) template += ident();
    template += T_OTHER(")")
              + T_BREAKLINE();

    return template;
  }

  var object = function(value) {
    var template = T_KEYWORD("object")
                 + T_OTHER("<")
                 + T_NUMBER(Object.keys(value).length)
                 + T_OTHER(">")
                 + T_OTHER("(");

    globalScope++;
    eachObjectIndex(function(key, val) {
      template += ident()
                + T_OTHER("[")
                + T_STRING(key)
                + T_OTHER("]")
                + T_WHITESPACE()
                + T_OPERATOR("=>")
                + T_WHITESPACE()
                + expr(val);
    })(value);

    globalScope--;

    template += ident()
              + T_OTHER(")")
              + T_BREAKLINE();

    return template;
  }

  // Export function.
  window.varbrowse = function(expression) {
    var ref;
    document.body.appendChild(
        ref = document.createElement("div")
      , ref.className = "varbrowse", ref.innerHTML = expr(expression)
      , ref);
  }
})();