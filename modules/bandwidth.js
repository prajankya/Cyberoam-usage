var cmd = require('node-cmd');
var Curl = require('node-libcurl').Curl;
var Easy = require('node-libcurl').Easy;
var querystring = require('querystring');

module.exports = {
    init: function() {
        this.curl = new Curl();
        this.statusCurl = new Curl();
        this.base_url = 'http://10.10.10.1/';
        this.url = this.base_url + "corporate/Controller?";

        this.curl.setOpt(Curl.option.URL, this.url);
        this.curl.setOpt(Curl.option.HTTPHEADER, ['User-Agent: nms-prajankya/1.0']);

        this.statusCurl.setOpt(Curl.option.URL, this.url + "mode=419");
        this.statusCurl.setOpt(Curl.option.HTTPHEADER, ['User-Agent: nms-prajankya/1.0']);

        this.cookie = "";
        this.gate = 'B';
        this.outObj = {
            PortB: {
                status: 0,
                speed: 0.001
            },
            PortU: {
                status: 0,
                speed: 0.001
            }
        };
        this.loggedIn = false;
        var that = this;

        this.statusCurl.on('end', function(statusCode, body) {
            if (statusCode == 200 && body.length > 0) {
                var ob = JSON.parse(body);
                for (var i = 0; i < ob.records.length; i++) {
                    that.outObj[ob.records[i].interface].status = parseInt(ob.records[i].gwstatus);
                }
            }
        });

        this.curl.on('end', function(statusCode, body) {
            if (body.length == 0 && that.loggedIn) {
                that.loggedIn = false;
                that.login();
            } else {
                var gat = body.substr(body.indexOf('Port'), 5);

                var se1 = body.substring(body.indexOf("<set")); //get The first SET tag(Received)
                se1 = se1.substring(0, se1.indexOf(">") + 1);
                se1 = se1.substring(se1.indexOf('current="') + 9); //get the current speed
                se1 = se1.substring(0, se1.indexOf('"'));
                that.outObj[gat].speed = parseFloat(se1);
            }
        });
        this.curl.on('error', this.curl.close.bind(this.curl));

        this.login();
    },
    poll: function() {
        if (!this.statusCurl._isRunning && this.loggedIn) {
            this.statusCurl.setOpt(Curl.option.COOKIE, "JSESSIONID=" + this.cookie + ";");
            this.statusCurl.perform();
        }
        if (!this.curl._isRunning && this.loggedIn) {
            this.gate = (this.gate == 'B') ? 'U' : 'B';
            var data = {
                'mode': 557,
                'json': '{"graph":["interface"],"time":["hourly"],"filter":["Port' + this.gate + '"]}'
            };
            data = querystring.stringify(data);

            this.curl.setOpt(Curl.option.POSTFIELDS, data);
            this.curl.setOpt(Curl.option.COOKIE, "JSESSIONID=" + this.cookie + ";");
            //curl.setOpt(Curl.option.VERBOSE, true);

            this.curl.perform();
        }
        //console.log(this.outObj);
        return this.outObj;
    },
    login: function() {
        console.log("logging in the Cyberoam");
        var that = this;
        cmd.get(__dirname + '/phantomjs ' + __dirname + '/login.js ' + this.base_url, function(data) {
            if (data.length) {
                var re = JSON.parse(data);
                console.log('data : ', re.JSESSIONID);
                that.cookie = re.JSESSIONID;
                that.loggedIn = true;
                console.log("logged in Cyberoam");
            }
        });
    }
};
