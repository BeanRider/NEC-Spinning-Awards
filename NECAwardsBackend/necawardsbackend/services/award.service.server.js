var async = require("async");
var sql = require("./customsql.js");

module.exports = function(app, mysql) {
    // Takes an existing list of awards and returns new awards that is not currently in that list of awards.
    function randomAward(req, res, next) {
        var con = null;
        function taskConnectToDB(fn) {
            sql.connectToDB(function (connection, isSuccess) {
                if (isSuccess) {
                    console.log("Connected!");
                    con = connection;
                    fn();
                } else {
                    console.error(connection);
                    fn(true);
                }
            });
        }

        var incomingData = req.body;
        var numAwards = incomingData.numAwards;
        var currentAwards = incomingData.currentAwards;
        console.log("incomingData = " + JSON.stringify(incomingData));

        var currentAwardsStringify = "";
        for (var i in currentAwards) {
            currentAwardsStringify += "'" + currentAwards[i] + "'";
            if (i < currentAwards.length - 1) {
                currentAwardsStringify += ", "
            }
        }

        var result = [];

        var finishRequest = function(result) {
            if (!result || (result && !result[3])) {
                res.send(500);
                return;
            }

            console.log("finishRequest:");
            console.log("About to send:\n" + JSON.stringify(result[3]));
            res.send(result[3]); // send only the second task result.
            console.log("Done.\n");
            // res.render('home.ejs', {layout: false, locals: { user_name: result.user_array, title: result.title_array }});
            if (con) {
                con.end();
            }
        };

        var getRandomAwardTask = function(fn) {
            var queryString =
                "SELECT * FROM necawards.awards " +
                (currentAwardsStringify.length === 0 ? "" : "WHERE awards.awardId NOT IN (" + currentAwardsStringify + ") ") +
                "ORDER BY RAND() " +
                "LIMIT " + numAwards + ";";
            console.log(queryString);
            con.query(
                queryString,
                function (err, rows, fields) {
                    if (err) {
                        console.error(err);
                        fn(true);
                        return;
                    }

                    for (var i in rows) {
                        var resultItem = {"award": rows[i]};
                        result.push(resultItem);
                    }

                    fn();
                });
        };

        function toFullDegree(shortDegree) {
            switch (shortDegree) {
                case "BM":
                    return "Bachelor of Music";
                case "MM":
                    return "Master of Music";
                case "DP":
                    return "Undergraduate Diploma";
                case "GD":
                    return "Graduate Diploma";
                case "Tufts/NEC":
                    return "Tufts/NEC Dual Degree";
                case "Harvard/NEC":
                    return "Harvard/NEC Dual Degree";
                case "DMA":
                    return "Doctor of Musical Arts";
                case "Honorary Diploma":
                    return "Honorary Diploma";
                case "NEC Prep":
                    return "NEC Preparatory School";
                case "AD":
                    return "Artist Diploma";
                case "CE":
                    return "Continuing Education";
                case "TMI":
                    return "Thelonious Monk Institute";
                default:
                    return shortDegree;
            }
        }

        function prepareAlum(alumId, returnResult) {
            var alumQueryString = "SELECT * FROM necawards.alum WHERE alumId = '" + alumId + "'";
            console.log(alumQueryString);
            con.query(
                alumQueryString,
                function (err, rows, fields) {
                    if (err) {
                        console.error(err);
                        returnResult(null);
                        return;
                    }
                    // console.log(rows[0]);

                    var foundAlum = rows[0];

                    // Parse discipline
                    if (foundAlum.discipline) {
                        foundAlum.disciplines = foundAlum.discipline.split("/").map(function (d) {
                            return d.trim();
                        });
                        delete foundAlum["discipline"];
                    }

                    if (foundAlum.gradYear) {
                        if (foundAlum.gradYear === "Faculty") {
                            // DO NOTHING
                        } else {
                            // Only non-faculty has grad year(s)
                            foundAlum.gradYears = foundAlum.gradYear.split(",").map(function (d) {
                                return d.trim();
                            });
                            // Don't delete gradYear because it might contain "Faculty" which is used for more logic

                            // Only non-faculty has degree(s)
                            if (foundAlum.degree) {
                                foundAlum.degrees = foundAlum.degree.split(",").map(function (d) {
                                    return toFullDegree(d.trim());
                                });
                                delete foundAlum["degree"];
                            }
                        }
                    }

                    if (foundAlum.studioTeacher) {
                        foundAlum.studioTeachers = foundAlum.studioTeacher.split("/").map(function(t) {
                            return t.trim();
                        });
                        delete foundAlum["studioTeacher"];
                    }

                    returnResult(foundAlum);
                });
        }

        var getAwardAlumTask = function(fn) {
            var totalTasks = result.length;
            for (var i in result) {
                const r = result[i];
                var ensembleId = r.award.ensembleId;

                if (ensembleId === null) {
                    var alumIds = r.award.alumId.split(",");
                    var alumId =  alumIds[Math.floor(alumIds.length * Math.random())].replace(/\s/g, '');
                    prepareAlum(alumId, function (alumResult) {
                        r.winner = alumResult;

                        totalTasks--;
                        // console.log("totalTask left (no ens) " + totalTasks);
                        if (totalTasks <= 0) {
                            fn(null, result);
                        }
                    });
                } else {

                    var ensembleAlumIds = r.award.alumId.split(",").map(function (d) {
                        return d.trim();
                    });
                    const lastIndex = ensembleAlumIds.length - 1;
                    ensembleAlumIds.forEach(function(a, i) {
                        prepareAlum(a, function (alumResult) {
                            if (!r.ensembleAlums) {
                                r.ensembleAlums = [];
                            }
                            r.ensembleAlums.push(alumResult);

                            if (i >= lastIndex) {
                                totalTasks--;
                                // console.log("totalTask left (ens) " + totalTasks);
                                if (totalTasks <= 0) {
                                    fn(null, result);
                                }
                            }
                        });
                    });
                }
            }
        };

        function getEnsembleTask(fn) {
            var todo = result.length;
            for (var i in result) {
                const const_i = i;
                const r = result[i];
                // console.log(r);
                var ensembleId = r.award.ensembleId;
                if (ensembleId) {
                    con.query(
                        "SELECT * FROM necawards.ensemble WHERE ensembleId = '" + ensembleId + "'",
                        function (err, rows, fields) {
                            if (err) {
                                console.error(err);
                                fn(true);
                                return;
                            }
                            r.winner = rows[0];

                            todo--;
                            if (todo <= 0) {
                                fn(null, result);
                            }
                        });
                } else {
                    todo--;
                    if (todo <= 0) {
                        fn(null, result);
                    }
                }
            }
        }

        //Using async.js
        async.series([
            taskConnectToDB,
            getRandomAwardTask,
            getAwardAlumTask,
            getEnsembleTask
        ], function(err, r) {
            finishRequest(r);
        });
    }

    function searchAward(req, res, next) {
        var con = null;
        function taskConnectToDB(fn) {
            sql.connectToDB(function (connection, isSuccess) {
                if (isSuccess) {
                    console.log("Connected!");
                    con = connection;
                    fn();
                } else {
                    console.error(connection);
                    fn(true);
                }
            });
        }

        var incomingData = req.body;
        var searchType = incomingData.type;
        var keyword = incomingData.keyword;
        console.log("incomingData = " + JSON.stringify(incomingData));

        var result = [];

        var finishRequest = function(result) {
            // TODO reenable this
            // if (!result || (result && !result[3])) {
            //     res.send(500);
            //     return;
            // }

            console.log("finishRequest:");
            // console.log("About to send:\n" + JSON.stringify(result[3]));
            if (searchType === "ALUM" || searchType === "DISCIPLINE") {
                console.log("About to send:\n" + JSON.stringify(result[1]));

                res.send(result[1]); // send only the 3rd task result.
            } else {
                res.send(result[3]); // send only the 3rd task result.
            }
            console.log("Done.\n");
            // res.render('home.ejs', {layout: false, locals: { user_name: result.user_array, title: result.title_array }});
            if (con) {
                con.end();
            }
        };

        // TODO convert all accents to normal letters
        // TODO split keyword when searching by space

        // TODO Limit search keywords that might query too much

        var alumSearchTask = function(fn) {
            var queryString;
            switch (searchType) {
                case "DISCIPLINE":
                    queryString =
                        "SELECT * FROM necawards.alum " +
                        "WHERE alum.discipline LIKE '%" + keyword + "%';";
                    break;
                case "ALUM":
                    queryString =
                        "SELECT * FROM necawards.alum " +
                        "WHERE alum.firstName LIKE '%" + keyword + "%' OR alum.lastName LIKE '%" + keyword + "%';";
                    break;
            }

            console.log(queryString);
            con.query(
                queryString,
                function (err, rows, fields) {
                    if (err) {
                        console.error(err);
                        fn(true);
                        return;
                    }

                    for (var i in rows) {
                        var resultItem = {"alum": rows[i]};
                        result.push(resultItem);
                    }

                    fn(null, result);
                });
        };

        var searchTask = function(fn) {
            var queryString;
            switch (searchType) {
                case "YEAR":
                    queryString =
                        "SELECT * FROM necawards.awards " +
                        "WHERE awards.compDate LIKE '%" + keyword + "%';";
                    break;
                case "AWARD":
                    queryString =
                        "SELECT * FROM necawards.awards " +
                        "WHERE awards.compName LIKE '%" + keyword + "%';";
                    break;
            }

            console.log(queryString);
            con.query(
                queryString,
                function (err, rows, fields) {
                    if (err) {
                        console.error(err);
                        fn(true);
                        return;
                    }

                    for (var i in rows) {
                        var resultItem = {"award": rows[i]};
                        result.push(resultItem);
                    }

                    fn();
                });
        };

        function toFullDegree(shortDegree) {
            switch (shortDegree) {
                case "BM":
                    return "Bachelor of Music";
                case "MM":
                    return "Master of Music";
                case "DP":
                    return "Undergraduate Diploma";
                case "GD":
                    return "Graduate Diploma";
                case "Tufts/NEC":
                    return "Tufts/NEC Dual Degree";
                case "Harvard/NEC":
                    return "Harvard/NEC Dual Degree";
                case "DMA":
                    return "Doctor of Musical Arts";
                case "Honorary Diploma":
                    return "Honorary Diploma";
                case "NEC Prep":
                    return "NEC Preparatory School";
                case "AD":
                    return "Artist Diploma";
                case "CE":
                    return "Continuing Education";
                case "TMI":
                    return "Thelonious Monk Institute";
                default:
                    return shortDegree;
            }
        }

        function prepareAlum(alumId, returnResult) {
            var alumQueryString = "SELECT * FROM necawards.alum WHERE alumId = '" + alumId + "'";
            console.log(alumQueryString);
            con.query(
                alumQueryString,
                function (err, rows, fields) {
                    if (err) {
                        console.error(err);
                        returnResult(null);
                        return;
                    }
                    // console.log(rows[0]);

                    var foundAlum = rows[0];

                    // Parse discipline
                    if (foundAlum.discipline) {
                        foundAlum.disciplines = foundAlum.discipline.split("/").map(function (d) {
                            return d.trim();
                        });
                        delete foundAlum["discipline"];
                    }

                    if (foundAlum.gradYear) {
                        if (foundAlum.gradYear === "Faculty") {
                            // DO NOTHING
                        } else {
                            // Only non-faculty has grad year(s)
                            foundAlum.gradYears = foundAlum.gradYear.split(",").map(function (d) {
                                return d.trim();
                            });
                            // Don't delete gradYear because it might contain "Faculty" which is used for more logic

                            // Only non-faculty has degree(s)
                            if (foundAlum.degree) {
                                foundAlum.degrees = foundAlum.degree.split(",").map(function (d) {
                                    return toFullDegree(d.trim());
                                });
                                delete foundAlum["degree"];
                            }
                        }
                    }

                    if (foundAlum.studioTeacher) {
                        foundAlum.studioTeachers = foundAlum.studioTeacher.split("/").map(function(t) {
                            return t.trim();
                        });
                        delete foundAlum["studioTeacher"];
                    }

                    returnResult(foundAlum);
                });
        }

        var getAwardAlumTask = function(fn) {
            var totalTasks = result.length;
            for (var i in result) {
                const r = result[i];
                var ensembleId = r.award.ensembleId;

                if (ensembleId === null) {
                    var alumIds = r.award.alumId.split(",");
                    var alumId =  alumIds[Math.floor(alumIds.length * Math.random())].replace(/\s/g, '');
                    prepareAlum(alumId, function (alumResult) {
                        r.winner = alumResult;

                        totalTasks--;
                        // console.log("totalTask left (no ens) " + totalTasks);
                        if (totalTasks <= 0) {
                            fn(null, result);
                        }
                    });
                } else {

                    var ensembleAlumIds = r.award.alumId.split(",").map(function (d) {
                        return d.trim();
                    });
                    const lastIndex = ensembleAlumIds.length - 1;
                    ensembleAlumIds.forEach(function(a, i) {
                        prepareAlum(a, function (alumResult) {
                            if (!r.ensembleAlums) {
                                r.ensembleAlums = [];
                            }
                            r.ensembleAlums.push(alumResult);

                            if (i >= lastIndex) {
                                totalTasks--;
                                // console.log("totalTask left (ens) " + totalTasks);
                                if (totalTasks <= 0) {
                                    fn(null, result);
                                }
                            }
                        });
                    });
                }
            }
        };

        function getEnsembleTask(fn) {
            var todo = result.length;
            for (var i in result) {
                const const_i = i;
                const r = result[i];
                // console.log(r);
                var ensembleId = r.award.ensembleId;
                if (ensembleId) {
                    con.query(
                        "SELECT * FROM necawards.ensemble WHERE ensembleId = '" + ensembleId + "'",
                        function (err, rows, fields) {
                            if (err) {
                                console.error(err);
                                fn(true);
                                return;
                            }
                            r.winner = rows[0];

                            todo--;
                            if (todo <= 0) {
                                fn(null, result);
                            }
                        });
                } else {
                    todo--;
                    if (todo <= 0) {
                        fn(null, result);
                    }
                }
            }
        }

        if (searchType === "ALUM") {
            async.series([
                taskConnectToDB,
                alumSearchTask
            ], function(err, r) {
                finishRequest(r);
            });
        } else if (searchType === "DISCIPLINE") {
            async.series([
                taskConnectToDB,
                alumSearchTask
            ], function(err, r) {
                finishRequest(r);
            });
        } else {
            async.series([
                taskConnectToDB,
                searchTask,
                getAwardAlumTask,
                getEnsembleTask
            ], function(err, r) {
                finishRequest(r);
            });
        }
    }

    function allIdsWithPhotos(req, res, next) {
        var con = null;
        function taskConnectToDB(fn) {
            sql.connectToDB(function (connection, isSuccess) {
                if (isSuccess) {
                    console.log("Connected!");
                    con = connection;
                    fn();
                } else {
                    console.error(connection);
                    fn(true);
                }
            });
        }

        var result = [];

        var finishRequest = function(result) {
            console.log("finishRequest");
            console.log("About to send:\n" + JSON.stringify(result[1]));
            res.send(result[1]); // send only the first task result.
            console.log("Done.\n");
            if (con) {
                con.end();
            }
        };

        var getAllIdsWithPhotos = function(fn) {
            var queryString =
                "SELECT alum.alumId AS winner FROM necawards.alum " +
                "WHERE hasPhoto = 1 " +
                "UNION ALL " +
                "SELECT ensemble.ensembleId AS winner FROM necawards.ensemble WHERE hasPhoto = 1;";

            console.log(queryString);
            con.query(
                queryString,
                function (err, rows, fields) {
                    if (err) {
                        console.error(err);
                        fn(true);
                        return;
                    }

                    for (var i in rows) {
                        var resultItem = rows[i].winner;
                        result.push(resultItem);
                    }

                    fn(null, result);
                });
        };

        //Using async.js
        async.series([
            taskConnectToDB,
            getAllIdsWithPhotos
        ], function(err, r) {
            finishRequest(r);
        });


    }

    module.exports.randomAward = randomAward;
    module.exports.allIdsWithPhotos = allIdsWithPhotos;
    module.exports.searchAward = searchAward;
};

// app.get('/home', function (req,res) {
//     var lock = 2;
//     var result = {};
//     result.user_array = [];
//     result.title_array = [];
//
//
//
//     // first query
//     var q1 = function(fn) {
//         var sql = 'SELECT * FROM necawards.awards ORDER BY RAND() LIMIT 1';
//         db.execute(sql)
//             .addListener('row', function(r) {
//                 result.user_array.push( { user_name: r.user_name } );
//             })
//             .addListener('result', function(r) {
//                 return fn && fn(null, result);
//             });
//     };
//
//     // second query
//     var q2 = function(fn) {
//
//         var sql = 'SELECT * FROM necawards.awards ORDER BY RAND() LIMIT 1';
//         db.execute(sql)
//             .addListener('row', function(r) {
//                 result.title_array.push( { title: r.title } );
//             })
//             .addListener('result', function(r) {
//                 return fn && fn(null, result);
//             });
//     };
//
//     //Standard nested callbacks
//     // q1(function (err, result) {
//     //     if (err) {
//     //         return; //do something
//     //     }
//     //
//     //     q2(function (err, result) {
//     //         if (err) {
//     //             return; //do something
//     //         }
//     //
//     //         finishRequest(result);
//     //     });
//     // });
//
//     //Using async.js
//     async.list([
//         q1,
//         q2
//     ]).call().end(function(err, result) {
//         finishRequest(result);
//     });
//
// });