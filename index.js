const Discord = require('discord.js');
const client = new Discord.Client();
const env = require('dotenv').config();
const quotes = require('./quotes'); 

client.on('ready', () => {
    console.log('Connected as ' + client.user.tag);

    client.user.setActivity('with myself $help');

    let textChannels = [];

    // Gather all text channels
    client.guilds.cache.forEach(guild => {
        guild.channels.cache.forEach(channel => {
            if(channel.type == "text")
                textChannels.push(channel.id)
        });
    });

    // //Send intro to first text channel
    // let generalChannel = client.channels.fetch(textChannels[0])
    //     .then(channel => {
    //         channel.send('Hello fellow chirp lords - $help to see what I can do');
    //     })
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
    }
  });

function printHelpText(msg){
    let helpText = ` Hello, I'm MAFT bot.  Type '$' followed by a command to talk to me.  This is what I can do.
    $help - see command list
    $quote - get inspirational quote
    $... more dope commands awimbawayonthereway
    `
    msg.channel.send(helpText);
}

function printQuoteText(msg){
    // Default @ mentions to inspirational quote
    let randomQuoteIdx = Math.floor(Math.random() * quotes.length)
    let {text, author} = quotes[randomQuoteIdx];
    msg.channel.send(`${text} - ${author ? author : 'anonymous'}`);
}

client.login(process.env.SECRET);