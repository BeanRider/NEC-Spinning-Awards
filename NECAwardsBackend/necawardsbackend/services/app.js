var mysql = require("mysql");

module.exports = function(app) {

    var awardService = require("./award.service.server.js");
    var gestureService = require("./gesture.service.server.js");
    module.exports.allServices = {
        awardService: awardService,
        gestureService: gestureService
    };

    // Initialize all services
    awardService(app, mysql);
    gestureService(app, mysql);
};