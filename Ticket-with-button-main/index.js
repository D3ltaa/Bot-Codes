const Discord = require('discord.js')
const delta = new Discord.Client({
    partials: ["CHANNEL", "MESSAGE", "REACTION", "USER", "GUILD_MEMBER"],
    intents: 32767,
})
const {MessageActionRow,MessageButton,} = require("discord.js");
const prefix = '!'
const { QuickDB } = require('quick.db');
const db = new QuickDB();


const staffteam = 'YOUR STEAMM TEAM ROLE ID'


delta.on('ready', async()=> {
    console.log(delta.user.username + " is up")
})

delta.on('messageCreate',async message =>{
    if (!message.content.startsWith(prefix) || message.author.bot) return;
    const args = message.content.slice(prefix.length).trim().split(/ +/);
    const command = args.shift().toLowerCase();


    if(command === 'ticket-setups'){
        if (!message.member.permissions.has([Discord.Permissions.FLAGS.MANAGE_MESSAGES]))return message.reply({content: `You dont have permissions to execute this command`})
        const channel = message.mentions.channels.first();
        if (!channel) return message.reply({content: "Add the channel you want setup the ticket"});
        const embed = new Discord.MessageEmbed()
        .setDescription('To create a ticket react with 📩')
        .setAuthor({name: message.guild.name,iconURL: message.guild.iconURL()})
        .setThumbnail(message.guild.iconURL({dynamic:true}))
        const row = new MessageActionRow()
        .addComponents(
            new MessageButton()
            .setStyle("SECONDARY")
            .setEmoji(`📩`)
            .setLabel('Create Ticket')
            .setCustomId("tickets")
        )
        channel.send({embeds: [embed],components: [row]}).then(message.delete({timeout:1500})).then(message.channel.send({content: `You setup ticket in #${channel}`}))
        
    }


})

delta.on('interactionCreate',async (interaction)=>{
    if(!interaction)return;
    if(interaction.isButton()){
        if(interaction.customId === 'tickets'){
            await interaction.update({})
            let count = await db.get(`tickets_${interaction.guild.id}`)
            let own = await db.get(`owner_${interaction.user.id}`)
            if(own)return interaction.followUp({content: `> **Warning:** Ticket limit reached, You already have 1 tickets open of the 1 allowed for this panel`,ephemeral:true})
            if(!count || count === null) count = 0
            const channel = await interaction.guild.channels.create(`ticket-${'0'.repeat(4 - count.toString().length)}${count}`,{
                type: "GUILD_TEXT",
                parent: interaction.channel.parentId,
                permissionOverwrites: [
                    {
                        id: interaction.guild.id,
                        deny: ["VIEW_CHANNEL"],
                    },
                    {
                        id: interaction.user.id,
                        allow: ["VIEW_CHANNEL","SEND_MESSAGES","ATTACH_FILES"]
                    },
                    { 
                      id: staffteam,
                      allow: ["VIEW_CHANNEL","SEND_MESSAGES","ATTACH_FILES"]
                    }
                ]
            })
            const embed = new Discord.MessageEmbed()
            .setDescription('Support will be with you shortly.\nTo close this ticket react with 🔒')
            .setFooter({text: interaction.guild.name,iconURL:interaction.guild.iconURL()})
            const row = new MessageActionRow()
            .addComponents(
                new MessageButton()
                .setStyle('SECONDARY')
                .setEmoji('🔒')
                .setLabel('Close')
                .setCustomId('close-ticket')
            )
            interaction.followUp({content: `Ticket Created ${channel}`,ephemeral:true})
             channel.send({embeds: [embed],components:[row]})
             await db.add(`tickets_${interaction.guild.id}`,1)
             await db.set(`owner_${interaction.user.id}`,interaction.user.id)
        }
        if(interaction.customId === 'close-ticket'){
            const row = new MessageActionRow()
            .addComponents(
                new MessageButton()
                .setStyle('DANGER')
                .setLabel('Close')
                .setCustomId('close'),
                new MessageButton()
                .setStyle('SECONDARY')
                .setLabel('Cancel')
                .setCustomId('cancel')
            )
            interaction.reply({content: `Are you sure you would like to close this ticket?`,components: [row]})
        }
        if(interaction.customId === 'close'){
            interaction.channel.delete({timeout:1500})
            await db.delete(`owner_${interaction.user.id}`)
        }
        if(interaction.customId === 'cancel'){
            interaction.message.delete({timeout:1500})
        }
    }
})

delta.login('YOUR TOKEN')