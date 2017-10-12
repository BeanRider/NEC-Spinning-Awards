var express = require("express");
var router = express.Router();
var s = require('../services/app.js');

/* GET: random award */
router.post("/random", s.allServices.awardService.randomAward);
router.post("/search", s.allServices.awardService.searchAward);

router.get("/all-with-photo", s.allServices.awardService.allIdsWithPhotos);
module.exports = router;