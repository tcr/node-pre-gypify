#!/usr/bin/env node

var fs = require("fs");
var opts = require("nomnom").parse();
var gyp = require("gyp-reader");

gyp("./binding.gyp", function (err, data) {
  if (err) {
    console.error(err.stack);
  }
  var targetName = data.targets.filter(function (target) {
    return !target.type;
  })[0].target_name;

  if (!data.targets.some(function (target) {
    return target.target_name == "action_after_build"
  })) {
    console.error("adding action_after_build...");
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
    console.error("writing binding.gyp...");
    fs.writeFileSync("./binding.gyp", JSON.stringify(data, null, "  "));
  }

  var packageJson = JSON.parse(fs.readFileSync("./package.json", "utf-8"));

  if (!packageJson.binary) {
    packageJson.binary = {};
  }

  // Merge existing packageJson.binary with ours
  Object.assign(packageJson.binary, {
    module_name: targetName,
    module_path: `out/${process.config.target_defaults.default_configuration}/`,
    host: "example.com",
  });

  packageJson.binary.package_name = opts.package_name || "{module_name}-v{version}.tar.gz";

  console.error("writing package.json...");
  fs.writeFileSync("package.json", JSON.stringify(packageJson, null, "  "));
  console.error("kk");
});
