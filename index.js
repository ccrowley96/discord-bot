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
    }
  });

function printHelpText(msg){
    let helpText = ` Hello, I'm MAFT bot.  Type '$' followed by a command to talk to me.  This is what I can do.
    $help - see command list
    $quote - get inspirational quote
    $meme - get random hot meme (refreshed every 30 mins)
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
    redditBot({type: enums.randomMeme, msg});
}

client.login(process.env.SECRET);