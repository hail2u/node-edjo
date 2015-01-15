#!/usr/bin/env node

'use strict';

var fs = require('fs');
var postcss = require('postcss');

var input = fs.readFileSync(process.argv[2], 'utf8');
console.log(postcss(function (css) {
  var decls = {};
  var edjo = postcss.root();
  css.eachDecl(function (decl) {
    var rule = decl.parent;

    if (rule.type !== 'rule') {
      return;
    }

    if (rule.parent.type !== 'root') {
      return;
    }

    var d = decl.prop + decl.value;

    if (!decls[d]) {
      decls[d] = {
        prop: decl.prop,
        selectors: [],
        value: decl.value
      };
    }

    decls[d].selectors = decls[d].selectors.concat(rule.selectors);
  });

  for (var decl in decls) {
    var d = decls[decl];
    edjo += d.selectors.join(',\n') + ' {\n  ' + d.prop + ': ' + d.value + ';\n}\n\n';
  }

  return postcss.parse(edjo);
}).process(input).css);
