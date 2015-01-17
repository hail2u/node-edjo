#!/usr/bin/env node

'use strict';

var fs = require('fs');
var postcss = require('postcss');

var dump = false;
var input = process.argv[2];

if (input === '--dump') {
  dump = true;
  input = process.argv[3];
}

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

  if (dump) {
    console.log(JSON.stringify(decls, null, 2));

    return postcss.parse('');
  }

  Object.keys(decls).forEach(function (decl) {
    var d = decls[decl];
    var props = '';

    Object.keys(d.prefixes).forEach(function (prefix, i, prefixes) {
      if (!d.prefixes[prefix]) {
        return;
      }

      if (prefix !== 'none') {
        prefix = '-' + prefix + '-';
      } else {
        prefix = '';
      }

      props += '  ' + prefix + d.prop + ': ' + d.value + ';\n';
    });

    edjo += d.selectors.reduce(function (a, b) {
      if (a.indexOf(b) < 0) {
        a.push(b);
      }

      return a;
    }, []).join(',\n') + ' {\n' + props + '}\n\n';
  });

  return postcss.parse(edjo);
}).process(fs.readFileSync(input, 'utf8')).css);
