var express = require('express');
var app = express();
var http = require('http').Server(app);
var io = require('socket.io')(http);
var usage = require('./modules/usage');

usage.init();

// serve index.html if root
app.get('/', function(req, res) {
    res.sendfile(__dirname + '/public/index.html');
});

// serve static files from public directory
app.use(express.static(__dirname + '/public'));

setInterval(function() {
    var use = usage.poll();
    io.emit("update_usage", use);
}, 2000);

// start
var port = Number(process.env.PORT || 4000);

http.listen(port, function() {
    console.log('listening on *:' + port);
});
