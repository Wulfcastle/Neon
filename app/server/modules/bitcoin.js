var BM = {};
module.exports = BM;
var web3 = require('web3');
web3 = new web3;
web3.setProvider(new web3.providers.HttpProvider('http://pegasi.whitjack.me:8545'));
var licensesContract = web3.eth.contract([{"constant":true,"inputs":[{"name":"","type":"uint256"}],"name":"licenses","outputs":[{"name":"name","type":"bytes32"}],"type":"function"},{"constant":false,"inputs":[{"name":"key","type":"string"}],"name":"addkey","outputs":[],"type":"function"},{"constant":false,"inputs":[{"name":"key","type":"string"}],"name":"checkkey","outputs":[{"name":"diditgetfound","type":"bool"}],"type":"function"},{"inputs":[],"type":"constructor"}]);
var licenses = licensesContract.at("0x832dff4f1009e24cee0f61c3542643fca721b7c2");

BM.addKey = function(key) {
  licenses.addkey.sendTransaction(key, {from:"0x30285329dda866d0832261f3c72d67f556e8eb84"}, function(err) {
    if (err)
      console.log(err);
  });
}

BM.checkKey = function(key) {
  var checked = licenses.checkkey.call(key);
  if(checked) {
    return true;
  } else {
    return false;
  }
}