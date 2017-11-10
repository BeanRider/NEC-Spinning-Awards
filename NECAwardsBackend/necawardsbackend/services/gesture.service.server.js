var async = require("async");
var sql = require("./customsql.js");
module.exports = function(app, mysql) {
    function newGesture(req, res, next) {

        var con = null;
        function taskConnectToDB(fn) {
            sql.connectToDB(function (connection, isSuccess) {
                if (isSuccess) {
                    // console.log("Connected!");
                    con = connection;
                    fn();
                } else {
                    console.error(connection);
                    fn(true);
                }
            });
        }

        var incomingData = req.body;
        var finishRequest = function(result) {
            // console.log("finishRequest: " + JSON.stringify(result));
            // console.log("Done.");
            // console.log("");
            if (result[1]) {
                res.send(200);
            } else {
                res.send(500);
            }
            if (con) {
                con.end();
            }
        };

        const maxTimeAllowed = 2000;
        function insertGestureTask(fn) {
            var incomingDataAsString;
            // Truncate if necessary.
            if (incomingData) {
                if (incomingData.length < 2) {
                    fn(null, true);
                    return;
                }
                incomingData.splice(100);
                incomingData = incomingData.filter(function(point) {
                    return point && point.t < maxTimeAllowed;
                });
                incomingDataAsString = JSON.stringify(incomingData)
            } else {
                fn();
                return;
            }
            var queryString =
                "INSERT INTO `necawards`.`gesture` (`values`) VALUES ('" + incomingDataAsString + "');";
            // console.log(queryString);
            con.query(
                queryString,
                function (err, rows, fields) {
                    if (err) {
                        console.error(err);
                        fn(null, false);
                    } else {
                        fn(null, true);
                    }

                });
        }

        //Using async.js
        async.series([
            taskConnectToDB,
            insertGestureTask
        ], function(err, r) {
            finishRequest(r);
        });
    }

    function randomGesture(req, res, next) {
        var con = null;
        function taskConnectToDB(fn) {
            sql.connectToDB(function (connection, isSuccess) {
                if (isSuccess) {
                    // console.log("Connected!");
                    con = connection;
                    fn();
                } else {
                    console.error(connection);
                    fn(true);
                }
            });
        }

        function finishRequest(result) {
            // console.log("finishRequest: " + JSON.stringify(result));
            // console.log("Done.");
            // console.log("");
            if (result[1] || result[1] === "") {
                res.send(200, result[1]);
            } else {
                res.send(500);
            }
            if (con) {
                con.end();
            }
        }

        function taskGetRandomGesture(fn) {
            var queryString = "SELECT gesture.values FROM necawards.gesture ORDER BY RAND() LIMIT 1;";
            // console.log(queryString);
            con.query(
                queryString,
                function (err, rows, fields) {
                    if (err) {
                        console.error(err);
                        fn(null, false);
                    } else {
                        if (rows[0]) {
                            fn(null, rows[0].values);
                        } else {
                            fn(null, "");
                        }
                    }
                });
        }

        async.series([
            taskConnectToDB,
            taskGetRandomGesture
        ], function(err, r) {
            finishRequest(r);
        });
    }

    module.exports.newGesture = newGesture;
    module.exports.randomGesture = randomGesture;
};