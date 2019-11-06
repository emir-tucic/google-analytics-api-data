var google = require("googleapis").google;
var scopes = "https://www.googleapis.com/auth/analytics.readonly";
var dotenv = require('dotenv');
dotenv.config();
var clientEmail = process.env.CLIENT_EMAIL;
var privateKey = process.env.PRIVATE_KEY;
var viewID = process.env.VIEW_ID;
var jwt = new google.auth.JWT(clientEmail, null, privateKey, scopes);
jwt.authorize(function (err, response) {
    if (response) {
        google.analytics("v3").data.ga.get({
            auth: jwt,
            ids: "ga:" + viewID,
            "start-date": "30daysAgo",
            "end-date": "today",
            metrics: "ga:pageviews",
            dimensions: "ga:pagePath",
            sort: "-ga:pageviews",
            filters: "ga:pagePath=~^/([\\w\\d-._~]+)/([\\w\\d-._~]+)-([\\w\\d-._~]+){12}$",
            "start-index": "1",
            "max-results": "10"
        }, function (err, result) {
            if (result) {
                console.log(result.data.rows);
            }
        });
    }
});
