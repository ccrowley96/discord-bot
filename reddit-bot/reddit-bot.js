const env = require('dotenv').config();
const enums = require('../resources/enums');
const snoowrap = require('snoowrap');
const rwc = require('random-weighted-choice');

let memeSources = [{id: 'dankmemes', weight: 3}, 
                   {id: 'memes', weight: 4},
                   {id: 'trebuchetmemes', weight: 1},
                   {id: 'PrequelMemes', weight: 2}]

let memeVault = {
    unset: true,
    memeCache: [],
    memeCount: 0
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

//Testing
// r.getSubreddit('memes')
//         .getHot()
//         .fetchMore({amount: 1, append: false})
//         .then(posts => {
//             console.log(posts.toJSON())
//         }).catch(err => reject(err));


const redditBot = function({type, msg}){
    if(type == enums.randomMeme){
        sendRandomRedditMeme(msg).then(meme => {
            msg.channel.send(meme);
        }).catch(err => {
            console.log(err);
            msg.channel.send('meme error :/');
        });
    }
}

module.exports = redditBot;

async function updateMemes(msg){
    msg.channel.send('Sec, refreshing memes...');
    memeVault.memeCache = [];
    memeVault.memeCount = 0;
    //Fetch new memes from all sources
    for(let sub of memeSources){
        let amount = 100;
        memeVault.memeCount += amount;
        memeVault[sub.id] = await setMemes({amount, subreddit: sub.id});
        //console.log(`Updated source ${sub.id}, ${memeVault[sub.id].length} new memes set`);
    }
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
    else if((Date.now() - timeDiff.lastUpdate) > timeDiff.thirtyMinutes){
        await updateMemes(msg)
    } 

    // Select random meme
    let randomSource = rwc(memeSources);

    let randomIdx = Math.floor(Math.random() * memeVault[randomSource].length);

    
    let probString = () => {
        let total = memeSources.reduce((acc, sub) => acc += sub.weight, 0);
        let weight = memeSources.filter(sub => sub.id == randomSource)[0].weight;
        return `${String(((weight / total) * 100))}%`
    }

    let selectedMeme = memeVault[randomSource][randomIdx];

    //Check that meme hasn't been sent already
    if(memeVault.memeCache.indexOf(selectedMeme.url) != -1 &&
       memeVault.memeCache.length < ((.75) * memeVault.memeCount)){
        // Meme already sent (retry)
        return sendRandomRedditMeme(msg);
    }

    memeVault.memeCache.push(selectedMeme.url);

    return `r/${randomSource} selected with ${probString()} chance\n ${selectedMeme.title} : (${selectedMeme.ups} upvotes)\n ${selectedMeme.url}`;   
}

async function setMemes({amount, subreddit}){
    return new Promise((resolve, reject) => {
        r.getSubreddit(subreddit)
        .getHot()
        .fetchMore({amount, append: false})
        .filter(post => post.url)
        .map(post => {
            return {url: post.url, 
                    title: post.title,
                    ups: String(post.ups)}
        })
        .then(memez => {
            timeDiff.lastUpdate = Date.now();
            resolve(memez);
        }).catch(err => reject(err));
    })
}

