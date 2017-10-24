var async = require("async");
var sql = require("./customsql.js");

module.exports = function(app, mysql) {

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

        function getAlumTask(alumId, returnResult) {
            let alumQueryString = "SELECT * FROM necawards.alum WHERE alumId = '" + alumId + "'";
            console.log(alumQueryString);
            con.query(
                alumQueryString,
                function (err, rows, fields) {
                    if (err) {
                        console.error(err);
                        returnResult(null);
                        return;
                    }
                    returnResult(convertAlum(rows[0]));
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
                    getAlumTask(alumId, function (alumResult) {
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
                        getAlumTask(a, function (alumResult) {
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

    async function sqlQuery(con, queryString) {
        return new Promise((resolve, reject) => {
            con.query(queryString, (err, rows, fields) => {
                if (err) {
                    console.error(err);
                    reject(err);
                } else {
                    resolve(rows);
                }
            });
        });
    }

    async function taskConnectToDB() {
        return new Promise((resolve, reject) => {
            sql.connectToDB(function (connection, isSuccess) {
                if (isSuccess) {
                    console.log("Connected!");
                    resolve(connection);
                } else {
                    console.error(connection);
                    reject(connection);
                }
            });
        });
    }

    function convertAlum(alumObj) {
        // Parse discipline
        if (alumObj.discipline) {
            alumObj.disciplines = alumObj.discipline.split("/").map(function (d) {
                return d.trim();
            });
            delete alumObj["discipline"];
        }

        if (alumObj.gradYear) {
            if (alumObj.gradYear === "Faculty") {
                // DO NOTHING
            } else {
                // Only non-faculty has grad year(s)
                alumObj.gradYears = alumObj.gradYear.split(",").map(function (d) {
                    return d.trim();
                });
                // Don't delete gradYear because it might contain "Faculty" which is used for more logic

                // Only non-faculty has degree(s)
                if (alumObj.degree) {
                    alumObj.degrees = alumObj.degree.split(",").map(function (d) {
                        return toFullDegree(d.trim());
                    });
                    delete alumObj["degree"];
                }
            }
        }

        if (alumObj.studioTeacher) {
            alumObj.studioTeachers = alumObj.studioTeacher.split("/").map(function(t) {
                return t.trim();
            });
            delete alumObj["studioTeacher"];
        }
        return alumObj;
    }

    async function searchAward(req, res, next) {

        const con = await taskConnectToDB();
        const incomingData = req.body;
        console.log("incomingData = " + JSON.stringify(incomingData));

        let result = [];

        const finishRequest = function(toSend) {
            // TODO reenable this
            // if (!result || (result && !result[3])) {
            //     res.send(500);
            //     return;
            // }

            console.log("finishRequest:");
            if (searchType === "NAME" || searchType === "DISCIPLINE") {
                console.log("About to send:\n" + JSON.stringify(toSend));
                res.send(toSend);
            } else {
                if (toSend.length === 0) {
                    res.send(toSend);
                }
                console.log("About to send:\n" + JSON.stringify(toSend[1]));
                res.send(toSend[1]);
            }

            if (con) {
                con.end();
            }
            console.log("Done.\n");
        };

        // TODO convert all accents to normal letters
        // TODO split keyword when searching by space

        // TODO Limit search keywords that might query too much

        let alumSearchTask = async function(field, keyword) {
            let queryString;
            let keywords = keyword.split(" ");
            switch (field) {
                case "DISCIPLINE":
                    queryString = "SELECT * FROM necawards.alum WHERE alum.discipline LIKE '%" + keyword + "%';";
                    // queryString =
                    //     "SELECT * FROM necawards.alum WHERE ";
                    // keywords.forEach((k, i) => {
                    //     queryString += "alum.discipline LIKE '%" + k + "%'";
                    //     if (i < (keywords.length - 1)) {
                    //         queryString += " OR "
                    //     }
                    // });
                    break;
                case "NAME":
                    queryString =
                        "SELECT * FROM necawards.alum WHERE ";
                    keywords.forEach((k, i) => {
                        queryString += "alum.firstName LIKE '%" + k + "%' OR " +
                                        "alum.lastName LIKE '%" + k + "%'";
                        if (i < (keywords.length - 1)) {
                            queryString += " OR "
                        }
                    });
                    queryString += ";";
                    break;
                default:
                    console.log("An alumSearchTask does not support search by '" + field + "' field yet!");
                    return Promise.reject();
            }

            console.log(queryString);
            try {
                const alumObjList = await sqlQuery(con, queryString);
                return Promise.resolve(alumObjList);
            } catch (e) {
                return Promise.reject(e);
            }
        };



        // For each alum, add their awards
        async function searchInAward_UsingAlumsTask(alumList) {
            let newResults = [];
            for (let alumObj of alumList) {
                let queryString =
                    "SELECT * FROM necawards.awards " +
                    "WHERE awards.alumId = '" + alumObj.alumId + "';";

                console.log(queryString);
                try {
                    const rows = await sqlQuery(con, queryString);
                    rows.forEach((awardObj) => {
                        console.log("got awardObj" + awardObj);
                        let resultItem = {"award": awardObj, "winner": convertAlum(alumObj)};
                        newResults.push(resultItem);
                    });
                } catch (e) {
                    return Promise.reject(e);
                }
            }
            return Promise.resolve(newResults);
        }

        var searchInAwardTask = function(fn) {
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
                default:
                    console.log("searchInAwardTask currently only supports YEAR, AWARD!");
                    fn(true);
                    return;
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


        let searchType = incomingData.type;
        let keyword = incomingData.keyword;

        if (keyword.length < 3) {
            finishRequest([]);
            return;
        }

        if (searchType === "NAME" || searchType === "DISCIPLINE") {
            const matchedAlums = await alumSearchTask(searchType, keyword);
            const matchedAwards = await searchInAward_UsingAlumsTask(matchedAlums);
            finishRequest(matchedAwards);
        } else {
            async.series([
                searchInAwardTask,
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