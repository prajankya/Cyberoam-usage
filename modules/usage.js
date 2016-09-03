var cmd = require('node-cmd');
var Curl = require('node-libcurl').Curl;
var Easy = require('node-libcurl').Easy;
var querystring = require('querystring');
var parseString = require('xml2js').parseString;

module.exports = {
    init: function() {
        this.curl = new Curl();
        this.base_url = 'http://10.10.10.1/';
        this.url = this.base_url + "corporate/Controller?";

        this.curl.setOpt(Curl.option.URL, this.url);
        this.curl.setOpt(Curl.option.HTTPHEADER, ['User-Agent: rmh-prajankya/1.0']);

        this.cookie = "";
        /*this.gate = 'B';
        this.outObj = {
            PortB: {
                status: 0,
                speed: 0.001
            },
            PortU: {
                status: 0,
                speed: 0.001
            }
        };*/
        this.loggedIn = false;
        var that = this;

        this.curl.on('end', function(statusCode, body) {
            if (body.length == 0 && that.loggedIn) {
                that.loggedIn = false;
                that.login();
            } else {
                //console.log(body);
                parseString(body, function(err, result) {
                    console.dir(JSON.stringify(result.t.r[0]));
                });
                /*var gat = body.substr(body.indexOf('Port'), 5);

                var se1 = body.substring(body.indexOf("<set")); //get The first SET tag(Received)
                se1 = se1.substring(0, se1.indexOf(">") + 1);
                se1 = se1.substring(se1.indexOf('current="') + 9); //get the current speed
                se1 = se1.substring(0, se1.indexOf('"'));
                that.outObj[gat].speed = parseFloat(se1);
                */
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
        //console.log(this.outObj);
        return this.outObj;
    },
    login: function() {
        //console.log("Logging in the Cyberoam");
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
