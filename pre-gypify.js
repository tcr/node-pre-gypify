#!/usr/bin/env node

var fs = require("fs");
var opts = require("nomnom").parse();
var gyp = require("gyp-reader");

try {
  fs.lstatSync('binding.gyp');
} catch (e) {
  console.error('binding.gyp does not exist.');
  console.error('Are you sure this is a binary node module?');
  process.exit(1);
}

gyp("./binding.gyp", function (err, data) {
  if (err || !data) {
    console.error('Error when parsing binding.gyp:');
    if (err) {
      console.error(err.stack);
    } else {
      console.error('no data in binding.gyp file!');
    }
    process.exit(1);
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

  delete packageJson.binary.remote_path;

  packageJson.binary.package_name = opts.package_name || "{module_name}-v{version}.tar.gz";

  console.error("writing package.json...");
  fs.writeFileSync("package.json", JSON.stringify(packageJson, null, "  "));
  console.error("kk");
});
