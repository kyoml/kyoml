const util = require('util');

function dump(obj) {
  console.log(util.inspect(obj, { showHidden: false, depth: null }))
}

module.exports = { dump }
