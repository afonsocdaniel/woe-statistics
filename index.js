    const {google} = require("googleapis");
    const { Client, GatewayIntentBits, ComponentAssertions } = require('discord.js');
    const phantom = require('phantom');
    const config = require('./config.json');
    const prefix = "!";
    const rankURL = "https://playxro.net/rankings/woe?page=";
    const playerURL = "https://playxro.net/rankings/woe-profile/";

    const CLASS = {
        4008: "Lord Knight",
        4009: "High Priest",
        4010: "High Wizard",
        4011: "Withesmith",
        4012: "Sniper",
        4013: "Assasin Cross",
        4014: "Paladin",
        4015: "Champion",
        4016: "Professor",
        4017: "Stalker",
        4018: "Creator",
        4019: "Clown",
        4020: "Gypsy",        
    }

    const client = new Client({ intents: [
        GatewayIntentBits.Guilds,
        GatewayIntentBits.GuildMessages,
        GatewayIntentBits.GuildMessageReactions,
        GatewayIntentBits.MessageContent,
    ] });
    
    // Register an event so that when the bot is ready, it will log a messsage to the terminal
    client.on("messageCreate", (message) => {
        if(!message.content.startsWith(prefix) || message.author.bot) {
            return;
        }

        if(message.content.startsWith("!help")){
            message.reply("To start the bot type !createcsv + number of pages of players on the ranking");
        }else if(message.content.startsWith("!createcsv")){
            var pages = message.content.split(" ")[1];
            message.reply("Starting the creation of CSV from "+ pages + " pages\n" + "https://docs.google.com/spreadsheets/d/1kEB5iktSLrQOyQ_2ZNkDIh71aRgGZ88HjbGi08Eycm0/edit?usp=sharing");
            StartSearch(parseInt(pages));
        }else if(message.content.startsWith("!test")){
            var charId = message.content.split(" ")[1];
            TestSkillCount(charId);
        }
    });

    async function TestSkillCount(charId){
        const instance = await phantom.create(['--ignore-ssl-errors=yes', '--load-images=no']);
        const page = await instance.createPage();
        const status = await page.open(playerURL+charId);
    
        if (status !== 'success') {
        console.error(status);
        await instance.exit();
        return;
        }
    
        const content = await page.property('content');
        await instance.exit();
    
        //string manipulations here
        //var basicInfo = content.split("{")[1];
        var result = content.replace(/&quot;/g,'"').split("data-page=\"")[1].split("\"></div>")[0];
        var skillCount = JSON.parse(result.split("skill_count\":")[1].split("\,\"kill_log")[0]);
        console.log(skillCount);
    }

    async function StartSearch(pages){ 
        var playerIDs = [];
        //for(var i = 1; i < pages+1; i++){  
            console.log("Scanning page:"+pages);     
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
        
            //string manipulations here
            //var basicInfo = content.split("{")[1];
            var result = content.replace(/&quot;/g,'"').split("data-page=\"")[1].split("\"></div>")[0];
            var basicInfo = JSON.parse(result.split("basic_info\":[")[1].split("]\,\"skill_count\"")[0]);
            var skillCount = JSON.parse(result.split("skill_count\":")[1].split("\,\"kill_log")[0]);
        
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
                acid_demonstration: basicInfo.acid_demonstration,
                support_skills: basicInfo.support_skills_used,
                healing: basicInfo.healing_done,
                wrong_support_skills: basicInfo.wrong_support_skills_used,
                wrong_healing: basicInfo.wrong_healing_done,
                sp_used: basicInfo.sp_used,
                ammo_used: basicInfo.ammo_used,
            }

            addRow("Players", getPlayerRow(player));
            if(player.class == "4010"){
                HighWizardRow(player, skillCount);
            }else if(player.class == "4012"){
                SniperRow(player, skillCount);
            }else if(player.class == "4018"){
                CreatorRow(player, skillCount);
            }else if(player.class == "4015"){
                PaladinRow(player, skillCount);
            }
        }
        console.log("Total Players: " +playerIDs.length);
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

    function HighWizardRow(player, skillCount){

        var obj = JSON.stringify(skillCount);
        var ms = 0;
        
        if(obj.includes("\id\":83")){
            ms =  obj.split("\"id\":83,\"count\":")[1].split("}")[0];
        }        

        var playerRow = {
            "values": [
                [
                    player.guild,
                    player.name,
                    player.damage_done,
                    ms,
                    player.kill,
                    player.death,
                    player.damage_done / ms,
                    player.kill / ms,
                    player.damage_done / player.kill,
                    (player.damage_done / ms) / player.kill,
                ]
            ]
        }
        addRow("High Wizard", playerRow);
    }
    
    function SniperRow(player, skillCount){
       
        var obj = JSON.stringify(skillCount);
        var ss = 0;
        
        if(obj.includes("\id\":382")){
            ss =  obj.split("\"id\":382,\"count\":")[1].split("}")[0];
        }        

        var playerRow = {
            "values": [
                [
                    player.guild,
                    player.name,
                    player.damage_done,
                    ss,
                    player.kill,
                    player.death,
                    player.damage_done / ss,
                    player.kill / ss,
                    player.damage_done / player.kill,
                    (player.damage_done / ss) / player.kill,
                ]
            ]
        }
        addRow("Sniper", playerRow);        
    }

    function CreatorRow(player, skillCount){
       
        var obj = JSON.stringify(skillCount);
        var ad = 0;
        
        if(obj.includes("\id\":490")){
            ad =  obj.split("\"id\":490,\"count\":")[1].split("}")[0];
        }        

        var playerRow = {
            "values": [
                [
                    player.guild,
                    player.name,
                    player.damage_done,
                    ad,
                    player.kill,
                    player.death,
                    player.damage_done / ad,
                    player.kill / ad,
                    player.damage_done / player.kill,
                    (player.damage_done / ad) / player.kill,
                ]
            ]
        }
        addRow("Chem DD", playerRow);        
    }

    function PaladinRow(player, skillCount){
       
        var obj = JSON.stringify(skillCount);
        var sac = 0, provoke = 0, endure =0, providence =0, pressure = 0;
        
        if(obj.includes("\id\":255")){
            sac =  obj.split("\"id\":255,\"count\":")[1].split("}")[0];
        }        
        if(obj.includes("\id\":6")){
            provoke =  obj.split("\"id\":6,\"count\":")[1].split("}")[0];
        }              
        if(obj.includes("\id\":8")){
            endure =  obj.split("\"id\":8,\"count\":")[1].split("}")[0];
        }               
        if(obj.includes("\id\":256")){
            providence =  obj.split("\"id\":256,\"count\":")[1].split("}")[0];
        }      
        if(obj.includes("\id\":367")){
            pressure =  obj.split("\"id\":367,\"count\":")[1].split("}")[0];
        }

        var playerRow = {
            "values": [
                [
                    player.guild,
                    player.name,
                    player.damage_taken,
                    sac,
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
    
    // client.login logs the bot in and sets it up for use. You'll enter your token here.
    client.login(config.token);