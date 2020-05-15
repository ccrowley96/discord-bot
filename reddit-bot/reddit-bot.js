const env = require('dotenv').config();
const enums = require('../resources/enums');
const snoowrap = require('snoowrap');
const rwc = require('random-weighted-choice');
const moment = require('moment-timezone');
moment().tz("America/Los_Angeles").format();

let memeSources = [{id: 'dankmemes', weight: 2}, 
                   {id: 'memes', weight: 2},
                   {id: 'trebuchetmemes', weight: 1},
                   {id: 'PrequelMemes', weight: 1},
                   {id: 'DeepFriedMemes', weight: 1},
                   {id: 'nukedmemes', weight: 1},
                   {id: 'MemeEconomy', weight: 2}
                  ]

let memeVault = {
    unset: true,
    memeCache: [],
    memeCount: 0,
    cacheHits: 0
}

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

const displayTimeString = (millis) => {
    return moment(millis).tz("America/Los_Angeles").format("dddd, MMMM Do YYYY, h:mm:ss a z")
}


const redditBot = function({type, msg}){
    if(type == enums.randomMeme){
        sendRandomRedditMeme(msg).then(meme => {
            msg.channel.send(meme);
        }).catch(err => {
            console.log(err);
            msg.channel.send('meme error :/');
        });
    } else if(type == enums.debugStats){
        let memeSourceString = memeSources.map(source => {
            return `\tsubreddit: ${source.id}, chance: ${getSourceProbabilityString(source.id)}, number stored: ${source.id in memeVault ? memeVault[source.id].length : 0}, ` +
            `number sent: ${source.id in memeVault ? memeVault[source.id].countSent : 0}` 
        }).join('\n');
        let statsString = `Memes last refreshed ${'lastUpdate' in timeDiff ? (displayTimeString(timeDiff.lastUpdate)) : 'a long time ago in a galaxy far away'}\n` + 
                          `Unique memes sent since last refresh: ${memeVault.memeCache.length}\n` +
                          `Meme sources: \n${memeSourceString}\n` +
                          `Total meme count: ${memeVault.memeCount}\n` +
                          `Cache hits since last refresh: ${memeVault.cacheHits} -- (# duplicate memes avoided)`;
        msg.channel.send(statsString);
    }
}

module.exports = redditBot;

async function updateMemes(msg){
    msg.channel.send('Sec, refreshing memes...');
    memeVault.memeCache = [];
    memeVault.cacheHits = 0;
    memeVault.memeCount = 0;
    //Fetch new memes from all sources
    for(let sub of memeSources){
        let amount = 100;
        memeVault[sub.id] = await setMemes({amount, subreddit: sub.id});
        memeVault.memeCount += memeVault[sub.id].length
        Object.defineProperty(memeVault[sub.id], "countSent", {
            enumerable: false,
            writable: true,
            value: 0
        });
        //console.log(`Updated source ${sub.id}, ${memeVault[sub.id].length} new memes set`);
    }
}

function getSourceProbabilityString(source){
    let total = memeSources.reduce((acc, sub) => acc += sub.weight, 0);
    let weight = memeSources.filter(sub => sub.id == source)[0].weight;
    return `${String(((weight / total) * 100))}%`
}

async function sendRandomRedditMeme(msg){
    //Initial Population of hot meme list
    if(memeVault.unset){
        //Set empty
        memeSources.forEach(sub => {
            memeVault[sub.id] = []
        })
        await updateMemes(msg)
        memeVault.unset = false;
    }
    //check time diff
    else if((Date.now() - timeDiff.lastUpdate) > timeDiff.hour){
        await updateMemes(msg)
    } 

    // Select random meme
    let randomSource = rwc(memeSources);

    let randomIdx = Math.floor(Math.random() * memeVault[randomSource].length);

    let selectedMeme = memeVault[randomSource][randomIdx];

    //Check that meme hasn't been sent already
    if(memeVault.memeCache.indexOf(selectedMeme.url) != -1 &&
       memeVault.memeCache.length < ((.75) * memeVault.memeCount)){
        // Meme already sent (retry)
        memeVault.cacheHits ++;
        return sendRandomRedditMeme(msg);
    }

    memeVault.memeCache.push(selectedMeme.url);
    
    //Increment count sent from this source
    memeVault[randomSource].countSent ++;
    return `r/${randomSource} selected with ${getSourceProbabilityString(randomSource)} chance\n ${selectedMeme.title} : (${selectedMeme.ups} upvotes)\n ${selectedMeme.url}`;   
}

async function setMemes({amount, subreddit}){
    return new Promise((resolve, reject) => {
        r.getSubreddit(subreddit)
        .getHot()
        .fetchMore({amount, append: false})
        .filter(post => !post.is_self) // make sure post is not just text
        .map(post => {
            return {url: post.url, 
                    title: post.title,
                    ups: String(post.ups)}
        }).filter(post => {
            return post.ups > 10 // ensure min of 10 upvotes
        })
        .then(memez => {
            timeDiff.lastUpdate = Date.now();
            resolve(memez);
        }).catch(err => reject(err));
    })
}

