const env = require('dotenv').config();
const enums = require('../resources/enums');
const snoowrap = require('snoowrap');

let hotMemeList = []
let timeDiff = {
    hour: 60 * 60 * 1000,
    thirtyMinutes: 60 * 30 * 1000,
    tenSeconds: 1000 * 10 // for testing purposes
}

const r = new snoowrap({
    userAgent: 'meme-generator by CrowlsYung',
    clientId: process.env.REDDIT_CLIENT_ID,
    clientSecret: process.env.REDDIT_SECRET,
    refreshToken: process.env.REFRESH_TOKEN
})


module.exports = function({type, msg}){
    if(type == enums.randomMeme){
        sendRandomRedditMeme().then(meme => {
            msg.channel.send(meme);
        }).catch(err => {
            msg.channel.send('meme error :/');
        });
    }
}

async function sendRandomRedditMeme(){
    //Initial Population of hot meme list
    if(hotMemeList.length == 0){
        await setTop100HotMemes();
    }
    //check time diff
    else if((Date.now() - timeDiff.lastUpdate) > timeDiff.thirtyMinutes){
        await setTop100HotMemes();
    } 

    // Send rando meme
    let randomIdx = Math.floor(Math.random() * hotMemeList.length);
    return hotMemeList[randomIdx];
}

function setTop100HotMemes(){
    return new Promise((resolve, reject) => {
        r.getSubreddit('dankmemes')
        .getHot()
        .fetchMore({amount: 100, append: false})
        .filter(post => post.url)
        .map(post => post.url).then(memez => {
            hotMemeList = memez;
            timeDiff.lastUpdate = Date.now();
            resolve(memez);
        }).catch(err => reject(err));
    })
}

