'use strict';
const host = "localhost";
const port = "8080";
const baseUri = host + ":" + port;

/*
 * numAwards:     number of awards to get back
 * currentAwards: the list of award IDs we current have on display.
 */
async function postForRandomAwards(numAwards, currentAwards) {
    return axios.post(
        "http://" + baseUri + "/api/award/random",
        {"numAwards": numAwards, "currentAwards": currentAwards});
}

function postDragGesture(dragGesture, callback) {
    // Post 1.9.0
    // $.ajax({
    //     url: "http://localhost:8080/api/gesture/new",
    //     method: "POST",
    //     contentType: "application/json",
    //     data: JSON.stringify(dragGesture)
    // }).then(callback);

    // Pre 1.9.0
    $.ajax({
        url: "http://localhost:8080/api/gesture/new",
        type: "POST",
        contentType: "application/json",
        data: JSON.stringify(dragGesture),
        complete: callback
    });
}

async function getWinnerIdsWithPhotos() {
    return axios.get("http://" + baseUri + "/api/award/all-with-photo");
}

function getRandomGesture(callback) {
    // var gesture = [
    //     {"t":0,"pos":{"x":233,"y":233}},
    //     {"t":200,"pos":{"x":651,"y":651}},
    //     {"t":400,"pos":{"x":1068,"y":1068}},
    //     {"t":600,"pos":{"x":1487,"y":1487}},
    //     {"t":800,"pos":{"x":1905,"y":1905}}];
    // callback({"response" : gesture });

    // Post 1.9.0
    // $.ajax({
    //     url: "http://localhost:8080/api/gesture/random",
    //     method: "GET"
    // }).then(callback);

    // Pre 1.9.0
    $.ajax({
        url: "http://localhost:8080/api/gesture/random",
        method: "GET",
        complete: callback
    });
}

function postSearch(body) {
    return axios.post("http://" + baseUri + "/api/award/search", body);
}

function urlExists(url) {
    let http = new XMLHttpRequest();
    http.open('HEAD', url, false);
    http.send();
    return http.status!=404;
}
