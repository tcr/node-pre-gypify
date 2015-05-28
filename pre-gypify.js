#!/usr/bin/env node

var fs = require('fs')
var opts = require("nomnom").parse();
var gyp = require('gyp-reader');

gyp('./binding.gyp', function (err, data) {
  setImmediate(function () {
    var targetName = data.targets.filter(function (target) {
      return !target.type;
    })[0].target_name;

    if (!data.targets.some(function (target) {
      return target.target_name == 'action_after_build'
    })) {
      console.error('adding action_after_build...');
      (data.targets || []).push({
        "target_name": "action_after_build",
        "type": "none",
        "dependencies": [ "<(module_name)" ],
        "copies": [
        {
          "files": [ "<(PRODUCT_DIR)/<(module_name).node" ],
          "destination": "<(module_path)"
        }
        ]
      });
      console.error('writing binding.gyp...');
      fs.writeFileSync('./binding.gyp', JSON.stringify(data, null, '  '));
    }

    var pack = JSON.parse(fs.readFileSync('./package.json', 'utf-8'));
    console.error('writing package.json...');
    if (!pack.binary) {
      pack.binary = {
        "module_name": targetName,
        "module_path": "out/" + process.config.target_defaults.default_configuration + "/",
        "host": "example.com",
      };
    }

    pack.binary.package_name = opts.package_name || "{module_name}-v{version}-{node_abi}-{platform}-{arch}.tar.gz";

    fs.writeFileSync('package.json', JSON.stringify(pack, null, '  '));
    console.error('kk');
  });
});
