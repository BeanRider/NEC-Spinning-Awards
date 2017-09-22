var mysql = require("mysql");
var fs = require('fs');

module.exports = (function() {
    var configFile = JSON.parse(fs.readFileSync('config/auth.json', 'utf8'));

    var username = configFile.username;
    var password = configFile.password;
    var host = configFile.host;

    return {
        "connectToDB": function(callback) {
            var calledCallback = false;
            var con = mysql.createConnection({
                host: host,
                user: username,
                password: password
            });
        con.connect(function (err) {
            if (err) {
                if (!calledCallback) {
                    callback(err, false);
                }
                calledCallback = true;
            } else {
                if (!calledCallback) {
                    callback(con, true);
                }
                calledCallback = true;
            }
        });

        con.on('error', function(err) {
            console.log('db error', err);
            if(err.code === 'PROTOCOL_CONNECTION_LOST') { // Connection to the MySQL server is usually
                console.log("PROTOCOL_CONNECTION_LOST code: " + err.code);
                console.log("Aborting...");
                if (!calledCallback) {
                    callback(err, false);
                }
                calledCallback = true;
                // handleDisconnect();                         // lost due to either server restart, or a
            } else {
                // connnection idle timeout (the wait_timeout
                console.log("unknown error err code: " + err.code);
                console.log("Aborting...");
                if (!calledCallback) {
                    callback(err, false);
                }
                calledCallback = true;

                // throw err;                                  // server variable configures this)
            }
        });
    }
}})();