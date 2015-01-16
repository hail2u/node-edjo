#!/usr/bin/env node

'use strict';

var fs = require('fs');
var postcss = require('postcss');

var input = fs.readFileSync(process.argv[2], 'utf8');
console.log(postcss(function (css) {
  var decls = {};
  var edjo = '';
  css.eachDecl(function (decl) {
    var rule = decl.parent;

    if (rule.type !== 'rule') {
      return;
    }

    if (rule.parent.type !== 'root') {
      return;
    }

    decl.prefix = '';

    if (decl.prop.indexOf('-') === 0) {
      var m = /^-(moz|ms|o|webkit)-(.*)$/.exec(decl.prop);
      decl.prefix = m[1];
      decl.prop = m[2];
    }

    var d = decl.prop + decl.value;

    if (!decls[d]) {
      decls[d] = {
        prefixes: {
          moz: false,
          ms: false,
          o: false,
          webkit: false,
          none: false
        },
        prop: decl.prop,
        selectors: [],
        value: decl.value
      };
    }

    if (decl.prefix) {
      decls[d].prefixes[decl.prefix] = true;
    } else {
      decls[d].prefixes.none = true;
    }

    decls[d].selectors = decls[d].selectors.concat(rule.selectors);
  });

  for (var decl in decls) {
    var d = decls[decl];
    var props = '';

    for (var prefix in d.prefixes) {
      if (!d.prefixes[prefix]) {
        continue;
      }

      if (prefix !== 'none') {
        prefix = '-' + prefix + '-';
      } else {
        prefix = '';
      }

      props += '  ' + prefix + d.prop + ': ' + d.value + ';\n';
    }

    edjo += d.selectors.reduce(function (a, b) {
      if (a.indexOf(b) < 0) {
        a.push(b);
      }

      return a;
    }, []).join(',\n') + ' {\n' + props + '}\n\n';
  }

  return postcss.parse(edjo);
}).process(input).css);
