var express = require('express');
var app = express();
var server = require('http').createServer(app);
var io = require('socket.io')(server);
var usage = require('./modules/usage');

usage.init();
var curUsage = [];

// serve index.html if root
app.get('/', function(req, res) {
    res.sendfile(__dirname + '/public/index.html');
});

// serve static files from public directory
app.use(express.static(__dirname + '/public'));

// start
var port = Number(process.env.PORT || 4000);
app.listen(port, function() {
    console.log("Listening on " + port);
});

io.on('connection', function(socket) {
    socket.on('event', function(data) {
        console.log("Event");
        console.log(data);
    });
    socket.on('disconnect', function() {});
});

setInterval(function() {
    var use = usage.poll();
    if (use !== curUsage) {
        curUsage = use;
        io.emit("update_usage", curUsage);
    }
}, 2000);

server.listen(3000);
