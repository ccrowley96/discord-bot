const {createServer} = require('http');
const env = require('dotenv').config();
const redditBot = require('../reddit-bot/reddit-bot');

const url = require('url');

let port = 8000;
let redditResponse = null;
let randomAuthString = "";
let code = null;

let startServer = () => {
    let server = createServer((request, response) => {
        let requestData = [];

        let queryParams = url.parse(request.url, true).query;

        console.log(queryParams);
        if('code' in queryParams){
            // set code for retrieval
            code = queryParams.code;
            redditBot(code);

        }

        request.on("data", chunk => {
            requestData.push(data);
        })
        request.on("end", () => {
            
            if(requestData.length){
                redditResponse = JSON.parse(requestData);
                console.log(redditResponse);
            }
        });

        response.writeHead(200, {'Content-Type': 'text/html'});
        response.write(`
            <h1>Authorize reddit account with maft bot</h1>
            <a href=${getAuthLink()}>Authorize Here</a>
        `);
        response.end();
    });

    server.listen(port);

    console.log(`Node Server listening on ${port}`);
}

function getRandomAlphaChar(){
    let alphabet = [..."abcdefghijklmnopqrstuvwxyz"];
    return alphabet[Math.floor(Math.random() * alphabet.length)];
}

function getAuthLink(){
    while(randomAuthString.length < 20)
        randomAuthString += getRandomAlphaChar();

    let authLink = `https://www.reddit.com/api/v1/authorize?` +
    `client_id=${process.env.REDDIT_CLIENT_ID}` +
    `&response_type=code` +
    `&state=${randomAuthString}` +
    `&redirect_uri=${process.env.REDDIT_REDIRECT_URI}` +
    `&duration=permanent`+
    `&scope=edit%20flair%20history%20modconfig%20modflair%20modlog%20modposts` +
    `%20modwiki%20mysubreddits%20privatemessages%20read%20report%20save%20` +
    `submit%20subscribe%20vote%20wikiedit%20wikiread`;

    return authLink;
}

exports.server = startServer;
exports.code = code;