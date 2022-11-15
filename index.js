    const {google} = require("googleapis");
    const { Client, GatewayIntentBits, ComponentAssertions } = require('discord.js');
    const phantom = require('phantom');
    const config = require('./config.json');
    const {JOB, SKILL, playerURL, rankURL, prefix} = require('./utils/constants');

    const client = new Client({ intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.MessageContent,
    ] });
    
    
    client.on("messageCreate", (message) => {
        if(!message.content.startsWith(prefix) || message.author.bot) {
            return;
        }

        if(message.content.startsWith("!help")){
            message.reply("To start the bot type !rrank + the page you want to search");
        }else if(message.content.startsWith("!rrank")){
            var pages = message.content.split(" ")[1];
            message.reply("Starting the creation of CSV on page "+ pages + " \n" + "https://docs.google.com/spreadsheets/d/1kEB5iktSLrQOyQ_2ZNkDIh71aRgGZ88HjbGi08Eycm0/edit?usp=sharing");
            startCrawling(parseInt(pages));
        }
    });

    async function startCrawling(pages){ 
        console.log("Starting...");
        var playerIDs = [];        
        //to-do - uncomment this to search all pages        
        //for(var i = 1; i < pages+1; i++){  
            const instance = await phantom.create(['--ignore-ssl-errors=yes', '--load-images=no']);
            const page = await instance.createPage();
            const status = await page.open(rankURL+pages);

            if (status !== 'success') {
                console.error(status);
                await instance.exit();
                return;
            }

            const content = await page.property('content');
            await instance.exit();

            const regex = new RegExp("(char_id&quot;:)[0-9]{1,10}", 'g');
            var match;
            while(match = regex.exec(content)){
                var result = match[0].split(":")[1];
                playerIDs.push(result);
            }
        //}

        for(var x = 0; x < playerIDs.length; x++){
            const instance = await phantom.create(['--ignore-ssl-errors=yes', '--load-images=no']);
            const page = await instance.createPage();
            const status = await page.open(playerURL+playerIDs[x]);
        
            if (status !== 'success') {
            console.error(status);
            await instance.exit();
            return;
            }
        
            const content = await page.property('content');
            await instance.exit();
        
            var result = content.replace(/&quot;/g,'"').split("data-page=\"")[1].split("\"></div>")[0];
            var basicInfo = JSON.parse(result.split("basic_info\":[")[1].split("]\,\"skill_count\"")[0]);
            var skillInfo = result.split("skill_count\":")[1].split("\,\"kill_log")[0];

        
            addPlayer(basicInfo, skillInfo);
        }
        console.log("Total Players Added: " +playerIDs.length);
    }

    function addPlayer(basicInfo, skillInfo){

        var player = {
            id: basicInfo.char_id,
            name: basicInfo.name,
            class: basicInfo.class,
            max_hp: basicInfo.max_hp,
            max_sp: basicInfo.max_sp,
            guild: basicInfo.gName,
            kill: basicInfo.kill_count,
            death: basicInfo.death_count,
            damage_done: basicInfo.damage_done,
            damage_taken: basicInfo.damage_received,
            hp_potion: basicInfo.hp_heal_potions,
            sp_potion: basicInfo.sp_heal_potions,
            yellow_gemstone: basicInfo.yellow_gemstones,
            red_gemstone: basicInfo.yellow_gemstones,
            blue_gemstone: basicInfo.blue_gemstones,
            acid_demonstration: basicInfo.acid_demostration,
            support_skills: basicInfo.support_skills_used,
            healing: basicInfo.healing_done,
            wrong_support_skills: basicInfo.wrong_support_skills_used,
            wrong_healing: basicInfo.wrong_healing_done,
            sp_used: basicInfo.sp_used,
            ammo_used: basicInfo.ammo_used,
        }

        addRow("Players", getPlayerRow(player));
        switch(player.class){
            case JOB.HIGH_WIZARD:
                addHW(player, skillInfo);
                break;
            case JOB.SNIPER:
                addSniper(player, skillInfo);
                break;
            case JOB.CREATOR:
                addCreator(player, skillInfo);
                break;
            case JOB.PROFESSOR:
                addProfessor(player, skillInfo);
                break;
            case JOB.PALADIN:
                addPaladin(player, skillInfo);     
                break;
            //to-do add Gypsy and HP
        }

    }

    function addHW(player, skillInfo){
        var meteorStorm = getSkill(SKILL.METEOR_STORM, skillInfo);

        if(parseInt(meteorStorm) > 0){
            //add HW DD
            var playerRow = {
                "values": [
                    [
                        player.guild,
                        player.name,
                        player.damage_done,
                        meteorStorm,
                        player.kill,
                        player.death,
                        player.damage_done / meteorStorm,
                        player.kill / meteorStorm,
                        player.damage_done / player.kill,
                        (player.damage_done / meteorStorm) / player.kill,
                    ]
                ]
            }
    
            addRow("HW DD", playerRow);
        }else{
            //Add HW FS
            //to-do
        }

    }
    
    function addSniper(player, skillInfo){
        var sharpshoot = getSkill(SKILL.SHARPSHOOT, skillInfo);

        var playerRow = {
            "values": [
                [
                    player.guild,
                    player.name,
                    player.damage_done,
                    sharpshoot,
                    player.kill,
                    player.death,
                    player.damage_done / sharpshoot,
                    player.kill / sharpshoot,
                    player.damage_done / player.kill,
                    (player.damage_done / sharpshoot) / player.kill,
                ]
            ]
        }

        addRow("Sniper", playerRow);        
    }

    function addProfessor(player, skillInfo){
        var dispel = getSkill(SKILL.DISPEL, skillInfo);
        var landProtector = getSkill(SKILL.LAND_PROTECTOR, skillInfo);
        var mindBreaker = getSkill(SKILL.MIND_BREAKER, skillInfo);
        var fiberLock = getSkill(SKILL.FIBER_LOCK, skillInfo);

        if( parseInt(dispel) >= parseInt(landProtector)){
            //Add Prof FS
            var playerRow = {
                "values": [
                    [
                        player.guild,
                        player.name,
                        player.damage_taken,
                        dispel,
                        mindBreaker,
                        fiberLock,
                        player.damage_taken / player.death,
                        player.death
                    ]
                ]
            }
            addRow("Prof FS", playerRow);    
        } else{
            //Add PROF DLP
            //to-do
        }   
    }

    function addCreator(player, skillInfo){
    
        var acidDemostration = getSkill(SKILL.ACID_DEMOSTRATION, skillInfo);
        
        if(parseInt(acidDemostration) > 0){
            //Add Chem DD
            var playerRow = {
                "values": [
                    [
                        player.guild,
                        player.name,
                        player.damage_done,
                        acidDemostration,
                        player.kill,
                        player.death,
                        player.damage_done / acidDemostration,
                        player.kill / acidDemostration,
                        player.damage_done / player.kill,
                        (player.damage_done / acidDemostration) / player.kill,
                    ]
                ]
            }
            addRow("Chem DD", playerRow);    
        } else{
            //Add Chem SPP
            //to-do
        }   
    }

    function addPaladin(player, skillInfo){
    
        var sacrifice = getSkill(SKILL.SACRIFICE, skillInfo);
        var provoke = getSkill(SKILL.PROVOKE, skillInfo);
        var endure = getSkill(SKILL.ENDURE, skillInfo);
        var providence = getSkill(SKILL.PROVIDENCE, skillInfo);
        var pressure = getSkill(SKILL.PRESSURE, skillInfo);


        var playerRow = {
            "values": [
                [
                    player.guild,
                    player.name,
                    player.damage_taken,
                    sacrifice,
                    provoke,
                    endure,
                    providence,
                    pressure,
                    player.death,
                    player.damage_taken/ player.death,
                ]
            ]
        }
        addRow("Paladin", playerRow);        
    }

    function getPlayerRow(player){
        var playerRow = {
            "values": [
                [
                    player.id,
                    player.name,
                    player.class,
                    player.max_hp,
                    player.max_sp,
                    player.guild,
                    player.kill,
                    player.death,
                    player.damage_done,
                    player.damage_taken,
                    player.hp_potion,
                    player.sp_potion,
                    player.yellow_gemstone,
                    player.red_gemstone,
                    player.blue_gemstone,
                    player.acid_demonstration,
                    player.support_skills,
                    player.healing,
                    player.wrong_support_skills,
                    player.wrong_healing,
                    player.sp_used,
                    player.ammo_used
                ]
            ]
        }

        return playerRow;
    }

    function getSkill(skillId, skillInfo){
        var skill = 0;
        if(skillInfo.includes("\id\":"+skillId)){
            skill =  skillInfo.split("\"id\":"+skillId+",\"count\":")[1].split("}")[0];
        }
        return skill;
    }
    
    async function getAuthSheets(){
        const auth = new google.auth.GoogleAuth({
            keyFile: "credentials.json",
            scopes: "https://www.googleapis.com/auth/spreadsheets"
        })

        const client = await auth.getClient();

        const googleSheets = google.sheets({
            version: "v4",
            auth: client
        })

        const spreadsheetId = "1kEB5iktSLrQOyQ_2ZNkDIh71aRgGZ88HjbGi08Eycm0";

        return{
            auth,
            client,
            googleSheets,
            spreadsheetId,
        };
    }

    
    async function addRow(page, value){
        const {googleSheets, auth, spreadsheetId} = await getAuthSheets();

        const row = await googleSheets.spreadsheets.values.append({
            auth,
            spreadsheetId,
            range: page,
            valueInputOption: 'RAW',
            resource: value
        })
    }

    // client.login logs the bot in and sets it up for use. You'll enter your token here.
    client.login(config.token);