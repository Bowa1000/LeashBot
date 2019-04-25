function nop(){}
//const log=require("log-level")
const log=require("loglevel");
log.setDefaultLevel(2)//;log.setLevel(0)
log.info("~ ~ ~ ~ ~ { initalizing } ~ ~ ~ ~ ~");
const settings=require("./storage/settings.json");
const Discord=require("discord.js-commando");
//const Timeout=require('await-timeout');
const clients=new Map()
log.info("setting up clients");
settings.list.forEach(label=>{
    log.debug(`setting up bot client ${label}`);
    clients.set(
        label,
        new Discord.Client({
            //apiRequestMethod:'sequential',
            commandPrefix:settings[label].prefix,
            //disabledEvents,//Array<WSEventType>
            disableEveryone:true,
            //fetchAllMembers:false,
            //http:HTTPOptions{version:7,api:'https://discordapp.com/api',cdn:'https://cdn.discordapp.com',invite:'https://discord.gg'},
            //invite:null,
            //messageCacheLifetime:0,
            //messageCacheLifetime:120,
            //messageCacheMaxSize:200,
            //messageSweepInterval:0,
            //messageSweepInterval:120,
            /*presence:{
                activity:{
                    application:{
                        id:""
                    }||"",
                    name:"",
                    type:["PLAYING","STREAMING","LISTENING","WATCHING"][Math.floor(Math.random()*5)]||"",
                    url:""
                },
                afk:false,
                status:["online","idle","invisible","dnd"][Math.floor(Math.random()*4)]
            },*/
            //restTimeOffset:500,
            //restWsBridgeTimeout:5000,
            //retryLimit:1,
            //shardCount:0,
            //shardId:0,
            //sync:false,
            //ws:WebsocketOptions{large_threshold:250,compress:true},
            //commandEditableDuration:30,
            //nonCommandEditable:true,
            owner:settings[label].owner,
            unknownCommandResponse:false
        })
    )
});
log.info(`made ${clients.size} client${(clients.size==1)?"":"s"}`);

log.info("client.registry");
clients.forEach((client,label)=>{
    log.debug(`loading client.registry for ${label}`);
    client.registry
    .registerDefaultGroups()
    .registerDefaultTypes()
    .registerGroups([["random","Random"],["message","Message"],["fun","Fun"],["roles","RoleManagement"],["","null"]])
    .registerCommandsIn(`${__dirname}/commands`)
    .registerDefaultCommands({
        help:false,
        prefix:true,
        eval_:true,
        eval:true,
        ping:true,
        commandState:true,
    })
});
//*
log.info("loading databases");
const sqlite=require("sqlite");
if(sqlite)clients.forEach((client,label)=>{
    log.debug(`loading database for ${label}`);
    client.setProvider(sqlite.open(`${__dirname}/storage/settings_${label}.sqlite3`).then(db=>new Discord.SQLiteProvider(db)))
    .then(log.debug)
    .catch(log.error)
});
//*/
function setStatus({client}){return new Promise((resolve,reject)=>{
    if(client.user.bot){
        let userCount=0,botCount=0;
        client.users.forEach(u=>u.bot?botCount++:userCount++);
        client.user.setActivity(`${userCount} users & ${botCount} bots in ${client.guilds.size} guilds`,{type:'WATCHING'})
        .then(log.debug,log.warn)
        .then(resolve,reject)
        //client.user.setActivity(`you`,{type:'WATCHING'})
    }else{
        reject(`${client.user.tag} is not a bot`)
        //client.user.setActivity(`${userCount} users & ${botCount} bots in ${client.guilds.size} guilds`,{type:'WATCHING'})
    }
})};
log.info("client[X].on(...)")
const owo=require(`${__dirname}/storage/owo.json`);
function test(text=[],is=[],has=[],hasAll=[]){
    let match=false
    text.forEach(t=>{
        if(!t){return}
        is.forEach(i=>{if(t==i) match=true})
        has.forEach(i=>{if(t.includes(i)) match=true})
        hasAll.forEach(i=>{
            let m=true
            i.forEach(j=>{if(!t.includes(j)) m=false})
            match=match||m
        })
    })
    return match
}
clients.forEach((client,label)=>{
    log.debug(`client[${label}].on(...)`)
    client
        .once("ready",async()=>{
            log.info(`${label} running as ${client.user}{${client.user.tag}}[${client.user.bot?"bot":"user"}]`)
            setStatus({client})
        })
        .on("message",m=>{
            if(!client.user.bot)return;
            if(m.type=="GUILD_MEMBER_JOIN"&&m.author.id==client.user.id)return m.delete();
            if(m.mentions.users.get(client.user.id)&&settings[label].icon)m.react(settings[label].icon).catch(nop);
            if(m.guild&&settings.reactionBlacklist&&settings.reactionBlacklist.includes(m.guild.id))return;
            if(m.author.bot)return;
            switch(m.channel.type){
                case"dm":
                case"group":
                    log.info(`\n${m.channel}/${m.author} (${m.author.username})\n${m.content}\n`)
                    break;
                case"text":
                    log.debug(`${m.guild.id}/${m.channel.parentID?m.channel.parent:""}/${m.channel}/${m.author} (${m.guild}/${m.channel.parentID?m.channel.parent.name:""}/${m.channel.name}/${m.author.username})\n${m.content}`);
                    if(m.channel.name=="✴void✴"&&!m.author.bot)m.delete().catch(nop)
                    else if(m.channel.name.includes("✅")&&m.channel.name.includes("❌")){//✅❌
                        //m.react("472968763470381099").then(()=>m.react("472968800950812672")).then(()=>m.react("472968837726470145"))
                        m.react("✅").then(()=>m.react("❌")).then(()=>m.react("❔")).catch(nop)
                    }
                    break;
                default:
                    break;
            }
        })
        .on("guildMemberAdd",member=>setStatus(member).then(()=>log.debug(`➕ ${member}(${member.user.tag})[${member.user.bot?"bot":"user"}] > ${member.guild.id}(${member.guild.name})`)))
        .on("guildMemberRemove",member=>{
            /*if(member.user.id=="272434110654316544")member.guild.leave();
            else //*/
            setStatus(member).then(()=>log.debug(`➖ ${member}(${member.user.tag})[${member.user.bot?"bot":"user"}] < ${member.guild.id}(${member.guild.name})`));
        })
        .on("guildCreate",guild=>setStatus(guild).then(()=>log.info(`➕ ${guild.me.user.id}(${guild.me.user.tag}[${guild.me.user.bot?"bot":"user"},me]) > ${guild.id}(${guild.name})`)))
        .on("guildDelete",member=>setStatus(member).then(log.info(`➖ ${member.user.id}(${member.user.tag}[${member.user.bot?"bot":"user"},me]) < ${member.guild.id}(${member.guild.name})`)))
        .on("error",log.error).on("warn",log.warn).on("debug",log.debug).on("info",log.info)
        .once("login",client.login)
});

log.info("logging in")
clients.forEach((client,label)=>client.emit("login",settings[label].token));
