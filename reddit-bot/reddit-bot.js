const env = require('dotenv').config();
const enums = require('../resources/enums');
const snoowrap = require('snoowrap');
const rwc = require('random-weighted-choice');
const moment = require('moment-timezone');
moment().tz("America/Los_Angeles").format();
const fs = require('fs');

let dev = false;

let memeSources = [{id: 'dankmemes', weight: 2}, 
                   {id: 'memes', weight: 2},
                   {id: 'trebuchetmemes', weight: 1},
                   {id: 'PrequelMemes', weight: 1},
                   {id: 'DeepFriedMemes', weight: 1},
                   {id: 'nukedmemes', weight: 1},
                   {id: 'MemeEconomy', weight: 2}
                  ]


class MemeVault{
    constructor(type, timeFrame){
        this.lastTimeFrame = null;
        this.type = type;
        this.timeFrame = timeFrame;
        this.unset = true,
        this.memeCount = 0
        this.retries = 0;
        this.lastUpdate = null;
    }

    initSourceArrays(sources){
        sources.forEach(sub => {
            this[sub.id] = []
        })
    }
}

MemeVault.memeCache = [];
MemeVault.cacheHits = 0;

let memeVaults = []

const r = new snoowrap({
    userAgent: 'meme-generator by CrowlsYung',
    clientId: process.env.REDDIT_CLIENT_ID,
    clientSecret: process.env.REDDIT_SECRET,
    refreshToken: process.env.REFRESH_TOKEN
});

//Test submsission
// r.getSubmission('t3_gjwds0').fetch()
// .then(meme => {
//     fs.writeFile('test.json', JSON.stringify(meme.toJSON()), 'utf8', () => null);
// }).catch(err => reject(err));

const displayTimeString = (millis) => {
    return moment(millis).tz("America/Los_Angeles").format("dddd, MMMM Do YYYY, h:mm:ss a z")
}

const redditBot = function(config){
    if(config.type == enums.hotMeme || config.type == enums.topMeme){
        sendRandomRedditMeme(config.msg, config.type, config.timeFrame).then(meme => {
            config.msg.channel.send(meme);
        }).catch(err => {
            console.log(err);
            config.msg.channel.send('meme error :/');
        });
    } 
    else if(config.type == enums.debugStats){
        let statString = "";

        for(let vault of memeVaults){
            let memeSourceString = "";
            memeSourceString += memeSources.map(source => {
                return `\t\tsubreddit: ${source.id}, chance: ${getSourceProbabilityString(source.id)}, number stored: ${source.id in vault ? vault[source.id].length : 0}, ` +
                `number sent: ${source.id in vault ? vault[source.id].countSent : 0}` 
            }).join('\n');
            statString += `${vault.type} ${vault.type == enums.topMeme ? '['+getTimeFrameString(vault)+']' : ''}\n` +
                              `\tMemes last refreshed ${vault.lastUpdate ? (displayTimeString(vault.lastUpdate)) : 'a long time ago in a galaxy far away'}\n` +                               
                              `\tMeme sources: \n${memeSourceString}\n` +
                              `\tTotal meme count: ${vault.memeCount}\n`;         
        }

        statString += (dev ? '[dev]\n' : '') + 
        `Unique memes sent since last refresh: ${MemeVault.memeCache.length}\n` +
        `Cache hits since last refresh: ${MemeVault.cacheHits} -- (# duplicate memes avoided)`;
        
        config.msg.channel.send(statString);
    }
}

module.exports = redditBot;

function getTimeFrameString(memeVault){
    if(memeVault.timeFrame == 'all')
        return 'the top memes of all time'
    else if(memeVault.timeFrame == 'hour')
        return `the top memes of the hour`
    else if(memeVault.timeFrame == 'day')
        return `the top memes of the day`
    else
        return `this ${memeVault.timeFrame}'s top memes`
}

async function updateMemes(msg, memeVault){

    msg.channel.send(`Sec, finding ${memeVault.type == enums.hotMeme ? 'hot memes...' : getTimeFrameString(memeVault) + '...'} ${dev ? '[dev]': ''}`);
    //Reset caches and counts for mv
    MemeVault.memeCache = [];
    MemeVault.cacheHits = 0;
    memeVault.memeCount = 0;
    memeVault.retries = 0;
    //Fetch new memes from all sources
    for(let sub of memeSources){
        let amount = 50;
        memeVault[sub.id] = await setMemes({amount, subreddit: sub.id, type: memeVault.type, vault: memeVault});
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

async function sendRandomRedditMeme(msg, type, timeFrame = 'week'){
    let memeVault;
    //Check if meme vault of [type] need initilization
    if(!memeVaults.find((vault) => vault.type == type)){
        //Init meme vault of that type
        memeVault = new MemeVault(type, timeFrame);
        memeVault.initSourceArrays(memeSources)
        memeVaults.push(memeVault);
        //fetch memes for vault type
        await updateMemes(msg,memeVault);
    }
    // find memeVault
    memeVault = memeVaults.find((vault) => vault.type == type);

    //check time diff (refresh is too much time passed)
    if((Date.now() - memeVault.lastUpdate) > enums.hour){
        await updateMemes(msg,memeVault);
    } 

    //check if type is top, and time frame has changed
    if(type == enums.topMeme && memeVault.lastTimeFrame != timeFrame){
        memeVault.timeFrame = timeFrame;
        await updateMemes(msg,memeVault);
    }

    // Select random meme
    let randomSource = rwc(memeSources);

    let randomIdx = Math.floor(Math.random() * memeVault[randomSource].length);

    let selectedMeme = memeVault[randomSource][randomIdx];

    //Check that meme hasn't been sent already
    if(!selectedMeme || MemeVault.memeCache.indexOf(selectedMeme.url) != -1){
        // Meme already sent (retry)
        MemeVault.cacheHits ++;
        // If 5 consecutive retries, refresh memes & cache
        memeVault.retries ++
        if(memeVault.retries > 5)
             await updateMemes(msg,memeVault);
        // Otherwise, retry with new random meme
        return sendRandomRedditMeme(msg);
    }

    //mark success, reset consecutive retries
    memeVault.retries = 0;
    MemeVault.memeCache.push(selectedMeme.url);
    
    //Increment count sent from this source
    memeVault[randomSource].countSent ++;
    return `[r/${randomSource}] meme selected from ${type == enums.hotMeme ? 'hot memes' : getTimeFrameString(memeVault)} with a ${getSourceProbabilityString(randomSource)} chance ${dev ? '[dev]': ''}\n`+
    `${selectedMeme.title} (${selectedMeme.ups} upvotes)\n ${selectedMeme.url}`;   
}

async function setMemes({amount, subreddit, type, vault}){
    return new Promise((resolve, reject) => {
        let q = r.getSubreddit(subreddit);
        q = type == enums.hotMeme ? q.getHot() : q.getTop({time: vault.timeFrame});
        q
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
            vault.lastTimeFrame = vault.timeFrame;
            vault.lastUpdate = Date.now();
            resolve(memez);
        }).catch(err => reject(err));
    })
}

