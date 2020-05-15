const Discord = require('discord.js');
const client = new Discord.Client();
const env = require('dotenv').config();
const quotes = require('./quotes');
const redditBot = require('./reddit-bot/reddit-bot');
const enums = require('./resources/enums');

client.on('ready', () => {
    console.log('Connected as ' + client.user.tag);

    client.user.setActivity('with myself $help');
})

let lastTimeFrame = 'all';

client.on('message', msg => {
    // If message starts with $ iss for maft
    if(msg.content.startsWith('$')){
        let messageText = msg.content.slice(1).trim();
        if(messageText.toLowerCase().startsWith('help')){
            printHelpText(msg);
        } 
        else if(messageText.toLowerCase().startsWith('quote'))  {
            printQuoteText(msg);
        }
        else if(messageText.toLowerCase().startsWith('meme')){
            printRandomHotMeme(msg);
        }
        else if(messageText.toLowerCase().startsWith('stats')){
            printRedditBotDevStats(msg);
        } 
        else if(messageText.toLowerCase().startsWith('topmeme')){
            let timeFrames = ['hour', 'day', 'week', 'month', 'year', 'all']
            let tf = messageText.toLowerCase().split(' ');
            if(tf.length > 1 && timeFrames.indexOf(tf[1]) != -1){
                lastTimeFrame = tf[1];
                printRandomTopMeme(msg, tf[1]);
            } else if(tf.length > 1 && timeFrames.indexOf(tf[1]) == -1){
                msg.channel.send(`Time frame needs to be in: [${String(timeFrames.join(', '))}], defaulting to ${lastTimeFrame}`);
                printRandomTopMeme(msg, lastTimeFrame);
            } else{
                printRandomTopMeme(msg, lastTimeFrame);
            }   
        }
    }
  });

function printHelpText(msg){
    let helpText = ` Hello, I'm MAFT bot.  Type '$' followed by a command to talk to me.  This is what I can do.
    $help - see command list
    $quote - get inspirational quote
    $meme - get random hot meme (refreshed every 30 mins)
    $topmeme - get random top meme
    $topmeme [hour | day | week | month | year | all] - get random top meme from [timeframe]
    $stats - get stats on meme sources and memes sent
    $... more commands awimbawayonthereway
    `
    msg.channel.send(helpText);
}

function printQuoteText(msg){
    // Default @ mentions to inspirational quote
    let randomQuoteIdx = Math.floor(Math.random() * quotes.length)
    let {text, author} = quotes[randomQuoteIdx];
    msg.channel.send(`${text} - ${author ? author : 'anonymous'}`);
}

function printRandomHotMeme(msg){
    redditBot({type: enums.hotMeme, msg});
}

function printRedditBotDevStats(msg){
    redditBot({type: enums.debugStats, msg})
}

function printRandomTopMeme(msg, timeFrame){
    redditBot({type: enums.topMeme, msg, timeFrame});
}

client.login(process.env.SECRET);