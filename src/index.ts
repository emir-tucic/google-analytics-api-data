const { google } = require("googleapis");

const scopes = "https://www.googleapis.com/auth/analytics.readonly";
const dotenv = require('dotenv');
dotenv.config();

const clientEmail = process.env.CLIENT_EMAIL;
const privateKey = process.env.PRIVATE_KEY;
const viewID = process.env.VIEW_ID;

const jwt = new google.auth.JWT(
  clientEmail,
  null,
  privateKey,
  scopes
);

jwt.authorize((err, response) => {
  if (response) {
    google.analytics("v3").data.ga.get(
      {
        auth: jwt,
        ids: "ga:" + viewID,
        "start-date": "30daysAgo",
        "end-date": "today",
        metrics: "ga:pageviews",
        dimensions: "ga:pagePath",
        sort: "-ga:pageviews",
        filters:
          "ga:pagePath=~^/([\\w\\d-._~]+)/([\\w\\d-._~]+)-([\\w\\d-._~]+){12}$",
        "start-index": "1",
        "max-results": "10"
      },
      (err, result) => {
        if (result) {
          console.log(result.data.rows);
        }
      }
    );
  }
});
