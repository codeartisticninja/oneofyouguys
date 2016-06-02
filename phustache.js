function getCond(src) {
  var lines = src.split("\n");
  var cond = lines.shift().trim();
  var block = "\n"+lines.join("\n");
  return { cond:cond, block:block }
}

module.exports = {
  replaceVars: function(src) {
    src = src.replace(/\{\{\{\$([^}]+)\}\}\}/g, '<?php echo $$$1; ?>');
    src = src.replace(/\{\{\&\$([^}]+)\}\}/g, '<?php echo $$$1; ?>');
    src = src.replace(/\{\{\$([^}]+)\}\}/g, '<?php echo htmlspecialchars($$$1); ?>');
    src = src.replace(/\{\{\%([^}]+)\%\}\}/g, '<?php echo urlencode($$$1); ?>');
    src = src.replace(/\{\{\?([^}]+)\?\}\}/g, '<?php echo $1; ?>');
    return src;
  },
  echo: function() { return function(src, render) {
    return "<?php echo " + src + "; ?>";
  };},
  do: function() { return function(src, render) {
    return "<?php " + src + " ?>";
  };},
  if: function() { return function(src, render) {
    src = getCond(src);
    return "<?php if ("+src.cond+"): ?>"+render(src.block)+"<?php endif; ?>";
  };},
  elseif: function() { return function(src, render) {
    src = getCond(src);
    return "<?php elseif ("+src.cond+"): ?>"+render(src.block);
  };},
  else: function() { return function(src, render) {
    src = getCond(src);
    return "<?php else: ?>"+render(src.block);
  };},
  switch: function() { return function(src, render) {
    src = getCond(src);
    return "<?php switch ("+src.cond+"): ?>"+render(src.block)+"<?php endswitch; ?>";
  };},
  case: function() { return function(src, render) {
    src = getCond(src);
    return "<?php case ("+src.cond+"): ?>"+render(src.block)+"<?php break; ?>";
  };},
  default: function() { return function(src, render) {
    src = getCond(src);
    return "<?php default: ?>"+render(src.block);
  };},
  while: function() { return function(src, render) {
    src = getCond(src);
    return "<?php while ("+src.cond+"): ?>"+render(src.block)+"<?php endwhile; ?>";
  };},
  doWhile: function() { return function(src, render) {
    src = getCond(src);
    return "<?php do { ?>"+render(src.block)+"<?php } while ("+src.cond+"); ?>";
  };},
  for: function() { return function(src, render) {
    src = getCond(src);
    return "<?php for ("+src.cond+"): ?>"+render(src.block)+"<?php endfor; ?>";
  };},
  foreach: function() { return function(src, render) {
    src = getCond(src);
    return "<?php foreach ("+src.cond+"): ?>"+render(src.block)+"<?php endforeach; ?>";
  };},
  function: function() { return function(src, render) {
    src = getCond(src);
    return "<?php function "+src.cond+" { ?>"+render(src.block)+"<?php } ?>";
  };}
}