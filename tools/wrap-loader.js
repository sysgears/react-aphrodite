module.exports = function(source) {
  return "Object.defineProperty(exports, '__esModule', { value: true }); exports['default'] = function() { return function(exports) {" + source + "\n exports.getCss = function() { return injectionBuffer; }; return exports;}({}); };";
};
