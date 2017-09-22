var express = require("express");
var router = express.Router();
var s = require('../services/app.js');

/* POST: a new gesture */
router.post("/new", s.allServices.gestureService.newGesture);
router.get("/random", s.allServices.gestureService.randomGesture);
module.exports = router;