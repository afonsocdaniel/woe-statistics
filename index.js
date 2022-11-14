    const { Client, GatewayIntentBits } = require('discord.js');
    const phantom = require('phantom');
    const config = require('./config.json');
    const prefix = "!";
    const rankURL = "https://playxro.net/rankings/woe?page=";
    const playerURL = "https://playxro.net/rankings/woe-profile/";

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
            message.reply("Starting the creation of CSV from "+ pages + " pages");
            StartSearch(parseInt(pages));
        }
    });

    async function StartSearch(pages){
        console.log("Starting search with " +pages + " pages");        
        var playerIDs = [];
        var players = [] ;

        for(var i = 1; i < pages+1; i++){  
            console.log("Scanning page:"+i);     
            const instance = await phantom.create(['--ignore-ssl-errors=yes', '--load-images=no']);
            const page = await instance.createPage();
            const status = await page.open(rankURL+i);

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
        }

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
                acid_demonstratio: basicInfo.acid_demonstration,
                support_skills: basicInfo.support_skills_used,
                healing: basicInfo.healing_done,
                wrong_support_skills: basicInfo.wrong_support_skills_used,
                wrong_healing: basicInfo.wrong_healing_done,
                sp_used: basicInfo.sp_used,
                ammo_used: basicInfo.ammo_used,
    
                skill_count: [skillCount]
            }
    
            players.push(player);
            console.log("adding:"+player.name);
        }
        console.log("Total Players: "+players.length);
    }
    
    // client.login logs the bot in and sets it up for use. You'll enter your token here.
    client.login(config.token);