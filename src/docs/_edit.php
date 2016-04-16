<?php
  if (@$_GET["file"]) {
    if (@$_POST["body"]) {
      $body = str_replace("\r\n", "\n", $_POST["body"]);
      file_put_contents(basename($_GET["file"]), $body);
      header("Refresh: 1; url=../../build/docs/".basename($_GET["file"], ".md").".html");
      die("<h1>Saved!");
    } else {
      $body = file_get_contents(basename($_GET["file"]));
    }
  } else {
    $_files = scandir("./");
    $files = array();
    foreach ($_files as $file) {
      if (substr($file, -3) === ".md") {
        $files[] = $file;
      }
    }
  }
?><!DOCTYPE html>
<html>
  <head>
    <meta charset="utf-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title><?php echo $_GET["file"]; ?></title>
    <link rel="stylesheet" type="text/css" href="../../build/style/markdown.css">
  </head>
  <body>
    <?php if(@$files): ?>
      <h1>Edit:</h1>
      <ul><?php foreach ($files as $file): ?>
        <li><a href="?file=<?php echo $file?>"><?php echo $file?></a></li>
      <?php endforeach; ?></ul>
    <?php else: ?>
      <h1><?php echo $_GET["file"]; ?></h1>
      <form method="post" action="">
        <p><textarea name="body" cols="64" rows="20"><?php echo htmlspecialchars($body); ?></textarea></p>
        <p><input type="submit" value="Save" /></p>
      </form>
    <?php endif; ?>
  </body>
</html>
