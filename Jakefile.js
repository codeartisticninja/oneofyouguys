/*jshint node:true */
/*globals complete, fail, jake, namespace, task, watchTask */
var fs          = require("fs"),
    path        = require("path"),
    Watcher     = require("file-watch"),
    livereload  = require("livereload"),
    mustache    = require("mustache"),
    markdown    = require("marked"),
    htmlmin     = require("htmlmin"),
    less        = require("less"),
    cssmin      = require("cssmin"),
    browserify  = require("browserify"),
    tsify       = require("tsify"),
    jsmin       = require("jsmin").jsmin,
    FtpClient   = require("ftp");

/**
 * Jakefile.js
 * For building web apps
 *
 * @date 26-05-2016
 */
var srcDir        = "./src/",
    outDir        = "./build/",
    staticFiles   = null,
    debug         = false,
    staticEnabled = true,
    reloadServer,
    watchThrottle = {};

task("default", [ "clean", "html:mustache", "html:md", "css:less", "js:ts", "static:json", "static:all" ]);

task("watch", function(){
  console.log("\nWatching...");
  debug = true;
  startWatching(".mustache",  "html:mustache");
  startWatching(".md",        "html:md");
  startWatching(".less",      "css:less");
  startWatching(".ts",        "js:ts");
  startWatching(".json",      "static:json");
  startWatching("",           "static:all");

  reloadServer = livereload.createServer();
  reloadServer.watch(outDir);

  jake.exec("statify", { printStderr: true });
});

task("deploy", [ "default" ], {async:true}, function(){
  console.log("\nDeploying to FTP...");
  var ftp = new FtpClient(),
      config = require("./.deploy.json"),
      localDir = path.normalize(outDir+".")+"/",
      ftpDir = config.rootPath + config.urlPath,
      files = new jake.FileList();

  files.include([ localDir, localDir+"**/*", localDir+"**/.*" ]);
  files = excludeIgnoredFiles(files).sort();
  var upload = function() {
    var localFile = files.shift(),
        ftpFile   = ftpDir + localFile.substr(localDir.length);

    console.log(localFile, "...");
    if (fs.statSync(localFile).isDirectory()) {
      ftp.mkdir(ftpFile, true, cb);
    } else {
      ftp.put(localFile, ftpFile, cb);
    }
  },
  cb = function(err){
    if (err) {
      fail(err);
    } else if (files.length) {
      upload();
    } else {
      ftp.end();
      console.log("...dONE!");
      complete();
    }
  };
  ftp.on("ready", function(){
    upload();
  });
  ftp.connect(config);
});

task("clean", function() {
  console.log("\nCleaning build dir...");
  jake.mkdirP(outDir);
  var files = new jake.FileList();
  files.include(outDir+"*");
  files.include(outDir+".*");
  excludeIgnoredFiles(files).forEach(function(file){
    jake.rmRf(file);
  });
  console.log("...dONE!");
});

namespace("html", function(){
  var data = {}, partials = {};
  try {
    data = require(srcDir+"data.json");
    data.block = function() {
      return function(src, render) {
        var name = src.split("=")[0].trim();
        src = src.substr(src.indexOf("=")+1);
        data[name] = render(src);
      };
    }
    data.pkg = require("./package.json");
    data.php = require("./phustache.js");
    data.deploy = require("./.deploy.json");
    data.baseUrl = data.deploy.rootUrl + data.deploy.urlPath;
  } catch(e) {}
  var htmlmin_opts = {
    collapseWhitespace: true
  };

  task("mustache", function(){
    console.log("\nCompiling Mustache...");
    fileTypeList(".mustache", true).forEach(function(inFile){
      var basename = path.basename(inFile, ".mustache");
      console.log(inFile, "#>", basename);
      partials[basename] = data.php.replaceVars(""+fs.readFileSync(inFile));
    });
    fileTypeList(".mustache").forEach(function(inFile){
      var outFile = outputFile(inFile, ".html"),
          output  = ""+fs.readFileSync(inFile);
      console.log(inFile, "->", outFile);

      setActive(outFile, data);
      output = data.php.replaceVars(output);
      output = mustache.render(output, data, partials);

      if (!debug) { output = htmlmin(output, htmlmin_opts); }
      jake.mkdirP(path.dirname(outFile));
      fs.writeFileSync(outFile, output);
    });
    console.log("...dONE!");
  });
  task("md", function(){
    jake.Task["html:mustache"].invoke();
    console.log("\nCompiling Markdown...");
    fileTypeList(".md").forEach(function(inFile){
      var outFile = outputFile(inFile, ".html"),
          output  = ""+fs.readFileSync(inFile);
      console.log(inFile, "->", outFile);

      setActive(outFile, data);
      var template = "{{> _markdown }}";
      var lines = output.trim().split("\n");
      if (lines[lines.length-1].substr(0, 3) === "{{>")
        template = lines.pop();
      data.title = lines[0].trim();
      data.yield = markdown(lines.join("\n"));
      output = mustache.render(template, data, partials);

      if (!debug) { output = htmlmin(output, htmlmin_opts); }
      jake.mkdirP(path.dirname(outFile));
      fs.writeFileSync(outFile, output);
    });
    console.log("...dONE!");
  });
});

namespace("css", function(){
  var less_opts = {};

  task("less", {async:true}, function(){
    console.log("\nCompiling LESS...");
    var filesLeft = fileTypeList(".less").length;
    if (!filesLeft) { console.log("...dONE!"); complete(); }
    fileTypeList(".less").forEach(function(inFile){
      var outFile = outputFile(inFile, ".css"),
          output  = ""+fs.readFileSync(inFile);
      console.log(inFile, "->", outFile);

      less_opts.filename = inFile;
      less.render(output, less_opts).then(
        function(o) {
          var output = o.css;
          if (!debug) { output = cssmin(output); }
          jake.mkdirP(path.dirname(outFile));
          fs.writeFileSync(outFile, output);
          if (--filesLeft === 0) { console.log("...dONE!"); complete(); }
        },
        function(err){
          fail("\u0007LESS compilation failed!\t" + err);
        }
      );
    });
  });
});

namespace("js", function(){
  var browserify_opts = {
        debug: true
      },
      tsify_opts = {
        noImplicitAny: true
      };

  task("ts", {async:true}, function(){
    console.log("\nCompiling TypeScript...");
    var filesLeft = fileTypeList(".ts").length;
    if (!filesLeft) { console.log("...dONE!"); complete(); }
    fileTypeList(".ts").forEach(function(inFile){
      var outFile = outputFile(inFile, ".js");
      console.log(inFile, "->", outFile);

      browserify(browserify_opts)
        .add(inFile)
        .plugin(tsify, tsify_opts)
        .bundle(function(err, buf){
          if (err) {
            fail("\u0007TypeScript err!\t" + err);
          } else {
            var output = ""+buf;
            if (!debug) { output = jsmin(output); }
            jake.mkdirP(path.dirname(outFile));
            fs.writeFileSync(outFile, output);
            if (--filesLeft <= 0) { console.log("...dONE!"); complete(); }
          }
        });

    });
  });
});

namespace("static", function(){
  task("json", function(){
    console.log("\nReencoding JSON...");
    fileTypeList(".json").forEach(function(inFile){
      var outFile = outputFile(inFile, ".json"),
          output  = ""+fs.readFileSync(inFile);
      console.log(inFile, "->", outFile);

      if (debug) {
        output = JSON.stringify(JSON.parse(output), null, 2);
      } else {
        output = JSON.stringify(JSON.parse(output));
      }

      jake.mkdirP(path.dirname(outFile));
      fs.writeFileSync(outFile, output);
    });
    console.log("...dONE!");
  });

  task("all", function(){
    console.log("\nCopying static files...");
    fileTypeList([".mustache", ".md", ".less", ".ts"]);
    staticFiles.resolve();
    excludeIgnoredFiles(staticFiles.toArray()).forEach(function(inFile){
      var outFile = outputFile(inFile);
      if (fs.statSync(inFile).isFile()) {
        jake.mkdirP(path.dirname(outFile));
        jake.cpR(inFile, outFile);
      }
    });
    console.log("...dONE!");
  });
});


/*** Helper functions ***/

function fileTypeList(suffixes, inverse) {
  var files = new jake.FileList();
  if (typeof suffixes === "string") {
    suffixes = [ suffixes ];
  }
  if (!staticFiles) {
    staticFiles = new jake.FileList();
    staticFiles.include(srcDir+"**/*");
    staticFiles.include(srcDir+"**/.*");
  }
  suffixes.forEach(function(suffix){
    files.include(srcDir+"**/*"+suffix);
    files.include(srcDir+"**/.*"+suffix);
    if (suffix) {
      staticFiles.exclude(srcDir+"**/*"+suffix);
      staticFiles.exclude(srcDir+"**/.*"+suffix);
    }
  });
  return excludeIgnoredFiles(files.toArray(), inverse);
}

function excludeIgnoredFiles(files, inverse) {
  var included = [],
      excluded = [];
  files.forEach(function(file){
    if (file.indexOf("/_") === -1) {
      included.push(file);
    } else {
      excluded.push(file);
    }
  });
  if (inverse) {
    return excluded;
  } else {
    return included;
  }
}

function outputFile(file, suffix) {
  var basename  = path.basename(file),
      dir       = path.dirname(file)+path.sep;
  dir = path.normalize(dir);
  dir = path.normalize(outDir) + dir.substr(path.normalize(srcDir).length);
  if (suffix) {
    if (basename.indexOf(".") !== -1) {
      basename = basename.substr(0, basename.lastIndexOf("."));
    }
    if (basename.indexOf(".") === -1) {
      basename += suffix;
    }
  }
  return dir+basename;
}

function startWatching(suffix, task) {
  var watchFiles = new jake.FileList(),
      watcher = new Watcher();
  watchFiles.include(srcDir+"**/*"+suffix);
  watcher.watch(task, watchFiles.toArray());
  watcher.on(task, function(){
    clearTimeout(watchThrottle[task]);
    clearTimeout(watchThrottle["static:all"]);
    watchThrottle[task] = setTimeout(function(){
      clearTimeout(watchThrottle["static:all"]);
      jake.Task[task].execute();
    }, 100);
  });
  return watcher;
}

function setActive(file, data) {
  if (!data.nav) return;
  var thisFile = path.parse(file);
  data.nav.forEach(function(link){
    if (!link.href) return;
    var linkFile = path.parse(link.href);
    if (linkFile.name === thisFile.name) {
      link.active = true;
      data.title = link.label;
    } else if (linkFile.name === "." && thisFile.name === "index") {
      link.active = true;
      data.title = link.label;
    } else {
      link.active = false;
    }
  });
}