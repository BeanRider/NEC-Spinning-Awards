const async = require("async");
const sql = require("./customsql.js");

module.exports = function(app, mysql) {

    class WinnerType {
        constructor(name) {
            this.name = name;
        }
        toString() {
            return `WinnerType.${this.name}`;
        }
    }
    WinnerType.ALUM = new WinnerType('ALUM');
    WinnerType.ENSEMBLE = new WinnerType('ENSEMBLE');

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
        let con = null;
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

        let incomingData = req.body;
        let numAwards = incomingData.numAwards;
        let currentAwards = incomingData.currentAwards;
        console.log("incomingData = " + JSON.stringify(incomingData));

        let currentAwardsStringify = "";
        for (let i in currentAwards) {
            currentAwardsStringify += "'" + currentAwards[i] + "'";
            if (i < currentAwards.length - 1) {
                currentAwardsStringify += ", "
            }
        }

        let result = [];

        let finishRequest = function(result) {
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

        let getRandomAwardTask = function(fn) {
            let queryString =
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

                    for (let i in rows) {
                        let resultItem = {"award": rows[i]};
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

    function convertAlumOrEnsemble_ToWinner(winnerType, obj) {
        switch (winnerType) {
            case WinnerType.ALUM:
                return [convertAlum(obj)];
            case WinnerType.ENSEMBLE:
                return [convertEnsemble(obj), convertEnsembleAlums(obj)];
            default:
                throw 'Bad winner type! + ' + winnerType;
        }
    }

    async function queryAlum_ById(con, alumId) {
        if (!alumId || !con) {
            return Promise.resolve([]);
        }
        const alumQueryString = "SELECT * FROM necawards.alum WHERE alumId = '" + alumId + "'";

        console.log(alumQueryString);
        try {
            const alumObjList = await sqlQuery(con, alumQueryString);
            return Promise.resolve(alumObjList[0]);
        } catch (e) {
            return Promise.reject(e);
        }
    }

    async function queryEnsemble_ById(con, ensembleId) {
        if (!ensembleId || !con) {
            return Promise.resolve([]);
        }
        const queryString = "SELECT * FROM necawards.ensemble WHERE ensembleId = '" + ensembleId + "'";

        console.log(queryString);
        try {
            const ensembleList = await sqlQuery(con, queryString);
            return Promise.resolve(ensembleList[0]);
        } catch (e) {
            return Promise.reject(e);
        }
    }

    function convertEnsembleAlums(ensembleObj) {
        let ensembleAlumIds = ensembleObj.alumIds.split(",").map(function (d) {
            return d.trim();
        });
        const toReturn = [];
        ensembleAlumIds.forEach(function(alumId) {
            toReturn.push(convertAlum(alumId));
        });
        return toReturn;
    }

    function convertEnsemble(ensembleObj) {
        return ensembleObj;
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

        const finishRequestError = function(error) {
            console.log("finishError: " + error);
            res.send(500);
            if (con) {
                con.end();
            }
            console.log("Done.\n");
        };

        const finishRequest = function(toSend) {

            console.log("finishRequest:");
            if (toSend === null) {
                console.log("Got a null... sending empty response [].");
                res.send([]);
            } else {
                console.log("About to send:\n" + JSON.stringify(toSend));
                res.send(toSend);
            }

            if (con) {
                con.end();
            }
            console.log("Done.\n");
        };

        const alumSearchTask = async function(field, keyword) {
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

        const ensembleSearchTask = async function(alumObjList) {
            if (!alumObjList || alumObjList.length === 0) {
                return Promise.resolve([]);
            }

            let queryString =
                "SELECT * FROM necawards.ensemble WHERE ";
            alumObjList.forEach((alumObj, i) => {
                queryString += "ensemble.alumIds LIKE '%" + alumObj.alumId + "%'";
                if (i < (alumObjList.length - 1)) {
                    queryString += " OR "
                }
            });
            queryString += ";";
            console.log(queryString);

            let ensembleObjList = [];
            try {
                ensembleObjList = await sqlQuery(con, queryString);
            } catch (e) {
                return Promise.reject(e);
            }
            return Promise.resolve(ensembleObjList);
        };

        const awardSearchTask = async function(field, keyword, isOutstanding) {
            let queryString;
            switch (field) {
                case "YEAR":
                    queryString =
                        "SELECT * FROM necawards.awards " +
                        "WHERE awards.compDate LIKE '%" + keyword + "%' " +
                        (isOutstanding ? "AND awards.outstanding = 1" : "") + ";";
                    break;
                case "AWARD":
                    queryString =
                        "SELECT * FROM necawards.awards " +
                        "WHERE awards.compName LIKE '%" + keyword + "%' " +
                        (isOutstanding ? "AND awards.outstanding = 1" : "") + ";";
                    break;
                default:
                    console.log("awardSearchTask currently only supports by YEAR, AWARD!");
                    return Promise.reject("awardSearchTask currently only supports by YEAR, AWARD!");
            }

            console.log(queryString);
            try {
                const awardObjs = await sqlQuery(con, queryString);
                let toReturn = [];
                awardObjs.forEach((awardObj) => {
                    toReturn.push(awardObj);
                });
                return Promise.resolve(toReturn)
            } catch (e) {
                return Promise.reject(e);
            }
        };

        // For each winner, add their awards
        const prepareCardList_UsingWinners = async function(winnerObjs, isOutstanding) {
            let cardObjList = [];
            for (let winnerObj of winnerObjs) {
                let queryString;
                let winnerType;
                if (winnerObj.ensembleId) {
                    // Ensemble
                    winnerType = WinnerType.ENSEMBLE;
                    queryString =
                        "SELECT * FROM necawards.awards " +
                        "WHERE awards.ensembleId = '" + winnerObj.ensembleId + "' " +
                        (isOutstanding ? "AND awards.outstanding = 1" : "") + ";";
                } else {
                    // Alum
                    winnerType = WinnerType.ALUM;
                    queryString =
                        "SELECT * FROM necawards.awards " +
                        "WHERE awards.ensembleId IS NULL AND awards.alumId LIKE '%" + winnerObj.alumId + "%' " +
                        (isOutstanding ? "AND awards.outstanding = 1" : "") + ";";
                }

                console.log(queryString);
                try {
                    const awardObjList = await sqlQuery(con, queryString);
                    awardObjList.forEach((awardObj) => {
                        console.log("got awardObj" + awardObj);

                        let convertedWinnerData = convertAlumOrEnsemble_ToWinner(winnerType, winnerObj);
                        let cardObj = {"award": awardObj, "winner": convertedWinnerData[0]};

                        if (winnerType === WinnerType.ENSEMBLE) {
                            cardObj["ensembleAlums"] = convertedWinnerData[1];
                        }

                        cardObjList.push(cardObj);
                    });
                } catch (e) {
                    return Promise.reject(e);
                }
            }
            return Promise.resolve(cardObjList);
        };

        const prepareAlum = async function(alumId) {
            try {
                let alumObj = await queryAlum_ById(con, alumId);
                if (!alumObj) {
                    return Promise.reject("No alums found with ID = " + alumId);
                }
                let alumObjConverted = convertAlum(alumObj);
                return Promise.resolve(alumObjConverted);
            } catch (e) {
                return Promise.reject(e)
            }
        };

        const prepareCardList_UsingAwards = async function(awardObjList) {
            let cardObjList = [];
            for (let awardObj of awardObjList) {
                const cardObj = {"award": awardObj};

                let ensembleId = awardObj.ensembleId;
                if (ensembleId === null) {
                    let alumIds = awardObj.alumId.split(",");
                    let alumId =  alumIds[Math.floor(alumIds.length * Math.random())].replace(/\s/g, '');
                    try {
                        cardObj.winner = await prepareAlum(alumId);
                    } catch (e) {
                        return Promise.reject(e);
                    }
                } else {
                    // Ensemble
                    let ensembleAlumIds = awardObj.alumId.split(",").map(function (d) {
                        return d.trim();
                    });
                    cardObj.ensembleAlums = [];
                    for (let ensembleAlumId of ensembleAlumIds) {
                        try {
                            const alumObj = await prepareAlum(ensembleAlumId);
                            cardObj.ensembleAlums.push(alumObj);

                            cardObj.winner = await queryEnsemble_ById(con, ensembleId);
                        } catch (e) {
                            return Promise.reject(e);
                        }
                    }
                }
                cardObjList.push(cardObj);
            }
            return Promise.resolve(cardObjList);
        };

        let searchType = incomingData.type;
        let keyword = incomingData.keyword;
        let outstanding = incomingData.outstanding;

        // Validation: make sure only alpha-numeric characters
        if (searchType === "YEAR" && keyword.length < 4) {
            finishRequestError("Failed input validation!");
            return;
        }

        if (keyword.length < 3 || !/^[a-zA-Z0-9\-\s]+$/.test(keyword)) {
            finishRequestError("Failed input validation!");
            return;
        }

        for (let k of keyword.split(" ")) {
            if (k.length < 3) {
                finishRequestError("Failed input validation!");
                return;
            }
        }

        // returns {pageNumber: [], pageNumber: [], ...}
        function paginateList(itemsPerPage, listOfItems) {
            let numItems = listOfItems.length;
            let paginatedResult = {};
            let numPages = Math.ceil(numItems * 1.0 / itemsPerPage);

            for (let pageNum = 0; pageNum < numPages; pageNum++) {
                paginatedResult[pageNum] = [];
                for (let itemNum = 0; itemNum < itemsPerPage; itemNum++) {
                    let idx = pageNum * itemsPerPage + itemNum;
                    if (idx >= numItems) {
                        break;
                    }
                    paginatedResult[pageNum].push(listOfItems[idx]);
                }
            }
            return paginatedResult;
        }

        if (searchType === "NAME" || searchType === "DISCIPLINE") {
            // Searching by winner
            try {
                const alumObjList = await alumSearchTask(searchType, keyword);
                const ensembleObjList = await ensembleSearchTask(alumObjList);

                // Both alum and ensemble winners
                const winnerObjList = alumObjList.concat(ensembleObjList);

                // Search awards that has either alums or ensemble
                const cardObjList = await prepareCardList_UsingWinners(winnerObjList, outstanding);

                // Split the list into pages
                const paginatedList = paginateList(43, cardObjList);

                finishRequest(paginatedList);
            } catch (e) {
                finishRequestError(e);
            }
        } else if (searchType === "YEAR" || searchType === "AWARD") {
            // Searching by award
            try {
                const awardObjList = await awardSearchTask(searchType, keyword, outstanding);
                const cardObjList = await prepareCardList_UsingAwards(awardObjList);

                // Split the list into pages
                const paginatedList = paginateList(43, cardObjList);

                finishRequest(paginatedList);
            } catch (e) {
                finishRequestError(e);
            }
        } else {
            finishRequestError("Unknown searchType: " + searchType);
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
