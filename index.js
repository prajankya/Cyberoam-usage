var usage = require('./modules/usage');

usage.init();
var use = usage.poll();
setInterval(function() {
    var use = usage.poll();
    //console.log(use);
}, 1000);
