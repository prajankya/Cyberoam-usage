var cmd = require('node-cmd');
var Curl = require('node-libcurl').Curl;
var Easy = require('node-libcurl').Easy;
var querystring = require('querystring');
var parseString = require('xml2js').parseString;
var filesize = require('filesize');

module.exports = {
    init: function() {
        this.curl = new Curl();
        this.base_url = 'http://10.10.10.1/';
        this.url = this.base_url + "corporate/Controller?";

        this.curl.setOpt(Curl.option.URL, this.url);
        this.curl.setOpt(Curl.option.HTTPHEADER, ['User-Agent: rmh-prajankya/1.0']);

        this.cookie = "";
        this.outObj = [];

        this.loggedIn = false;
        var that = this;

        this.curl.on('end', function(statusCode, body) {
            if (body.length == 0 && that.loggedIn) {
                that.loggedIn = false;
                that.login();
            } else {
                parseString(body, function(err, result) {
                    var ar = result.t.r;
                    var out = [];
                    for (var i = 0; i < ar.length; i++) {
                        var obj = {};
                        obj.name = ar[i].c1[0];
                        obj.upload = {};
                        obj.download = {};

                        obj.upload.total = filesize(ar[i].c2);
                        obj.download.total = filesize(ar[i].c3);
                        obj.upload.speed = filesize(ar[i].c4) + "/s";
                        obj.download.speed = filesize(ar[i].c5) + "/s";

                        obj.connections = parseInt(ar[i].c6[0]);
                        out.push(obj);
                    }
                    that.outObj = out;
                });
            }
        });
        this.curl.on('error', this.curl.close.bind(this.curl));

        this.login();
    },
    poll: function() {
        if (!this.curl._isRunning && this.loggedIn) {
            var data = {
                'mode': 331,
                'group1': 'srcip',
                'group2': 'applicationname',
                'condition': '10.4.0.99'
            };
            data = querystring.stringify(data);
            this.curl.setOpt(Curl.option.POSTFIELDS, data);
            this.curl.setOpt(Curl.option.COOKIE, "JSESSIONID=" + this.cookie + ";");
            //this.curl.setOpt(Curl.option.VERBOSE, true);
            this.curl.perform();
        }
        return this.outObj;
    },
    login: function() {
        console.log("Logging in the Cyberoam");
        var that = this;
        cmd.get(__dirname + '/phantomjs ' + __dirname + '/login.js ' + this.base_url, function(data) {
            if (data.length) {
                var re = JSON.parse(data);
                that.cookie = re.JSESSIONID;
                that.loggedIn = true;
                console.log("logged in Cyberoam");
            }
        });
    }
};
