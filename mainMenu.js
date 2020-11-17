// This is the primary file
const readline = require("readline");
const chalk = require('chalk');
const puppeteer = require('puppeteer');


let rl;

var MainMenu = {
    chooseInstagramOrPinterest: function(browser) {
        rl = readline.createInterface({
            input: process.stdin,
            output: process.stdout
        });
        console.clear();
        rl.question(chalk.blue("--- Welcome To DesignFeed Crawler ---\n\n") +
            "What operation would you like to perform \n" +
            "1. Download image from instagram. \n" +
            "2. Download Pinterest board \n" +
            "3. Exit", (choice) => {
            switch (choice) {
                case '1': // instagram
                    rl.close();
                    instagramCrawler.DownloadInstagramImage(browser);
                    break;
                case '2': // pinterest
                    console.clear();

                    rl.close();
                    pinterestmCrawler.DownloadPinterestBoardLaunch(browser);
                    break;
                case '3':
                    process.exit();
                default: // invalid choice
                    rl.close();
                    console.clear();
                    console.log(chalk.red("Invalid Choice please enter the correct choice!! \n \n"));
                    MainMenu.chooseInstagramOrPinterest(browser);

            }
        });
    }
}

var instagramCrawler = require('./instagramCrawler')(MainMenu);
var pinterestmCrawler = require('./pinterestFeedCrawler')(MainMenu);

async function StartApplication() {
    const browser = await puppeteer.launch({headless: true});
    MainMenu.chooseInstagramOrPinterest(browser);
}

//,userDataDir: "./user_data"
StartApplication();
module.exports = MainMenu