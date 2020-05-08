const Discord = require('discord.js');
const client = new Discord.Client();
const env = require('dotenv').config();
const quotes = require('./quotes');

// Find all 

client.on('ready', () => {
    console.log('Connected as ' + client.user.tag);

    client.user.setActivity('with myself');

    let textChannels = [];

    // Gather all text channels
    client.guilds.cache.forEach(guild => {
        guild.channels.cache.forEach(channel => {
            if(channel.type == "text")
                textChannels.push(channel.id)
        });
    });

    //Send intro to first text channel
    let generalChannel = client.channels.fetch(textChannels[0])
        .then(channel => {
            channel.send('Hello fellow chirp lords - @maft to get a quote');
        })
})

client.on('message', msg => {
    // Default @ mentions
    let randomQuoteIdx = Math.floor(Math.random() * quotes.length)
    let {text, author} = quotes[randomQuoteIdx];
    if(msg.mentions.has(client.user))
        msg.reply(`${text} - ${author ? author : 'anonymous'}`);
  });

client.login(process.env.SECRET);