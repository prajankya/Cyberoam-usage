var page = require('webpage').create(),
    system = require('system'),
    t, address;

if (system.args.length === 1) {
    console.log('Usage: login.js <some URL>');
    phantom.exit(1);
} else {
    t = Date.now();
    address = system.args[1];
    page.open(address, function(status) {
        if (status !== 'success') {
            console.log('FAIL to load the address');
        } else {
            page.evaluate(function() {
                $("#username").val("nms");
                $("#password").val("padniHiTyog8");
                $("input[type=submit]").click();
            });
        }
    });

    page.onLoadFinished = function() {
        if (page.url.indexOf("index.jsp") > 0) { //logged in
            var obj = {};
            t = Date.now() - t;
            obj.loading_time = (t / 1000) + ' sec';
            var cookies = page.cookies;

            for (var i in cookies) {
                obj[cookies[i].name] = cookies[i].value;
            }
            console.log(JSON.stringify(obj));
            phantom.exit();
        }
    };
}
