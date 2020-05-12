const {createServer} = require('http');
const url = require('url');

let port = 8000;
let redditResponse = null;
let randomAuthString = "";

let startServer = () => {
    let server = createServer((request, response) => {
        let requestData = [];

        let queryParams = url.parse(request.url, true).query;

        console.log(queryParams);

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
    `client_id=13DXWk-44nT9Eg` +
    `&response_type=code` +
    `&state=${randomAuthString}` +
    `&redirect_uri=http://localhost:${String(port)}` +
    `&duration=permanent`+
    `&scope=edit%20flair%20history%20modconfig%20modflair%20modlog%20modposts` +
    `%20modwiki%20mysubreddits%20privatemessages%20read%20report%20save%20` +
    `submit%20subscribe%20vote%20wikiedit%20wikiread`;

    return authLink;
}

module.exports = startServer;