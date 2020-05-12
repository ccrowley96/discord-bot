const request = require('request');
const env = require('dotenv').config();

function sendRequest(options, data){
    request.post(options, (err, res, body) => {
        if(err){
            return console.log(err);
        }
        console.log(body);
    });
}


function startRedditBot(code){
    const authRequestData = JSON.stringify({
        grant_type: 'authorization_code',
        code,
        redirect_uri: process.env.REDDIT_REDIRECT_URI
    });

    //let authRequestData = `grant_type=authorization_code&code=${code}&redirect_uri=${process.env.REDDIT_REDIRECT_URI}`;

    const authRequestOptions = {
        url: 'https://www.reddit.com/api/v1/access_token',
        auth: {
            username: process.env.REDDIT_CLIENT_ID,
            password: process.env.REDDIT_SECRET
        },
        json: true,
        form: {
            grant_type: 'authorization_code',
            code,
            redirect_uri: process.env.REDDIT_REDIRECT_URI
        }
    };

    sendRequest(authRequestOptions);
}

module.exports = startRedditBot;