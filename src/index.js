var google = require("googleapis").google;
const AWS = require("aws-sdk");
const s3 = new AWS.S3();

const config = require('./common/config.js');

var clientEmail = config.google.client_email;
var privateKey = config.google.private_key;
var viewID = config.view_id; 
var scopes = config.scopes; 

const authenticateUser = async (clientEmail, privateKey, scopes) => {
    try{
        var jwt = await new google.auth.JWT(clientEmail, null, privateKey, scopes);
        return jwt;    
    }catch(error){
        return error;
    }
}

const authorizeUser = async (jwt) => {
    return new Promise(function(resolve, reject) {
        jwt.authorize(function (err, response) {

            if(err){
                console.log('Error Authorizing the user: ', err)
                reject(null);
            }

            if(response){
                resolve(response);
            }
        });
    })
}

const getDataFromGoogleAPI = async(query = {}) => {
    return new Promise(function(resolve, reject) {
        google.analytics("v3").data.ga.get(query, function (err, result) {
            if (result) {
                resolve(result.data.rows);
            }
            if(err){

                reject(err);
            }
        });
    })
}

const uploadToS3 = (client, params) => {
    console.log(`Uploading ${params.fileName} to S3...`);
    const s3Params = {
      Bucket: config.aws.bucketName,
      Key: `${params.env}/feeds/most-popular/${params.fileName}`,
      Body: params.fileBody,
      ACL: "public-read",
      ContentType: "application/json"
    };

    return new Promise((resolve, reject) => {
      client.upload(s3Params, function(err, data) {
        if (err) {
          reject(err);
        } else {
          resolve(data);
        }
      });
    });
};

const createQuery = (auth, viewId, startDate = "30daysAgo", endDate = "today", metrics = "ga:pageviews", options)  => {
    const query = {
        auth,
        ids: "ga:" + viewId,
        "start-date": startDate,
        "end-date": endDate,
        metrics,
        ...options,
    } 
    return query;
}

const createListOfData = (data) => {
    const dataList = data.map(el => {
        return  {
            "article_url": `${el[0]}`,
            "number_of_views": `${el[1]}`
        }
    })

    return dataList;
}

async function run(params = {env:'qa'}){
    const jwt = await authenticateUser(clientEmail, privateKey, scopes);

    try{
        const isAuthorized = await authorizeUser(jwt);

        if(isAuthorized){
            const query = createQuery(jwt,viewID, "30daysAgo", "today", "ga:pageviews", {dimensions: "ga:pagePath",sort: "-ga:pageviews",filters: "ga:pagePath=~^/([\\w\\d-._~]+)/([\\w\\d-._~]+)-([\\w\\d-._~]+){12}$","start-index": "1","max-results": "10"});
            const data = await getDataFromGoogleAPI(query);
            const dataList = createListOfData(data);
            /*
            await uploadToS3(s3,{
                fileName: `feed.json`,
                fileBody: `${JSON.stringify(dataList)}`,
                env: params.env,
            });
            */
        }
            
    }catch(e){
        console.log(e)
    }
}


run({env:'dev'});
module.exports = {
    run
};