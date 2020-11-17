const puppeteer = require('puppeteer');
const $ = require('cheerio');
const CronJob = require('cron').CronJob;
const nodemailer = require('nodemailer');
const fs = require('fs');
const request = require('request');
const https = require('https');
const http = require('http');
const readline = require("readline");
const chalk = require('chalk');
const pintrestBoardsFolderName = 'Pintrest-board';
// const download = require('image-downloader'); // might use this library in future

var rl;
var url = '';
var browser;

var Stream = require('stream').Transform;
var fsPath = require('fs-path');
var pintrestData =  {
    'board-name': '',
    'images-objects':[]
};
var UserData = require('./Settings.json');
var isLoggedIn = false;

// configures browser to load url
async function configureBrowser() {
    const pages = await browser.pages()
    let page;
    for (let i = 0; i < pages.length && !page; i++) {
        const isHidden = await pages[i].evaluate(() => document.hidden)
        if (!isHidden) {
            page = pages[i]
        }
    }
    await page.setViewport({
        width: 1920,
        height: 1080,
    });
    try{
        await page.goto(url);

    }catch (exception){
        rl.close();
        console.log(chalk.red("Error occurred while fetching url. Please make sure to enter correct url.."));
        DownloadPintrestBoard(browser);
        return null;
    }
    return page;
};

// Implements login functionality currently disabled
async function UserAuthentication(page) {
    // click login button
    //await page.evaluate(()=> document.body.innerHTML);
    var loginButton = await page.$('[data-test-id="loginButton"] > button');
    await loginButton.evaluate( loginButton => loginButton.click())

    await page.waitFor(1000);
    await page.type('[data-test-id="emailInputField"] > fieldset > span > input', UserData["pinterest"]["email"], {delay: 20})
    await page.type('[data-test-id="passwordInputField"] > fieldset > span > input', UserData["pinterest"]["password"], {delay: 20})
    var loginButtonAuth = await page.$('[data-test-id="registerFormSubmitButton"] > button');

    //await page.waitFor(1000);
    await loginButtonAuth.evaluate( loginButtonAuth => loginButtonAuth.click())

    await page.waitForNavigation({waitUntil: 'networkidle2'});
    return page;
}

async function downloadOnlyBoardImages(page) {

    await page.setCacheEnabled(false);
    try {
      //  page = await UserAuthentication(page);
    }catch (exception){

    }
    console.clear()
    console.log("Scrapping Through pinterest, Please wait...")
    await page.evaluate(async () => {
        await new Promise((resolve, reject) => {
            var totalHeight = 0;
            var distance = 100;
            var timer = setInterval(() => {
                var scrollHeight = document.body.scrollHeight;
                window.scrollBy(0, distance);
                totalHeight += distance;

                if(document.querySelector('[data-test-id="secondaryBoardGrid"]')) {
                    clearInterval(timer);
                    resolve();
                }

                if(totalHeight >= scrollHeight ){
                    clearInterval(timer);
                    resolve();
                }
            }, 100);
        });
    });

/// Implements different way to parse data for authenticated users @TODO Will Unable in future Version
/*
await page.evaluate(async (isLoggedIn) => {
    const delay = 50000;
    const wait = (ms) => new Promise(res => setTimeout(res, ms));
    var selector = isLoggedIn? '[data-grid-item="true"]': '.Collection-Item';
    const count = async () => document.querySelectorAll(selector).length;
    console.log(count);
    var selector =  isLoggedIn? '[data-test-id="board-feed"]:last-child': '.Collection:last-child'  //'data-test-id="secondaryBoardGrid"'
    const scrollDown = async (selector) => {
        document.querySelector(selector)
            .scrollIntoView({ behavior: 'smooth', block: 'end', inline: 'end' });
    }

    let preCount = 0;
    let postCount = 0;
    do {
        preCount = await count();
        await scrollDown(selector);
        await wait(delay);
        postCount = await count();
    } while (postCount > preCount);
    await wait(delay);


},isLoggedIn);
*/

    let html = await page.evaluate(() => document.body.innerHTML);
    var selector = isLoggedIn?'[data-test-id="board-feed"]' : '.Masonry';
    var html1 = $(selector,html).first();
    pintrestData['board-name'] = $('h1',html).text();
    console.log("Total Images Found on "+ pintrestData['board-name'] + ": " +chalk.green($('img', html1).length))
    var i=0;
    $('img', html1).each(function() {
        pintrestData['images-objects'].push($(this).attr('srcset'));
//        pintrestData['images-objects'].push($(this)[0].attribs.src);
    });
    downloadImages(pintrestData['images-objects']);

};

function downloadImages() {
    for(var i=0; i< pintrestData['images-objects'].length;i++) {

        if(pintrestData['images-objects'][i]!= undefined) {
            var imageString = pintrestData['images-objects'][i];
            var urls = imageString.replace(/\s+[0-9]+(\.[0-9]+)?[wx]/g, "").split(/,/);
            var highestQualityurls = urls[urls.length-1].slice(1);
            downloadImageToUrl(highestQualityurls,"downloads/" + pintrestBoardsFolderName+ '/'+ pintrestData['board-name']+ '/'+  'img_'+i+'.png');
        }
    }
    console.log(chalk.green("Download Completed!!! \nPlease Check Downloads/ folder"));
    pinterestmCrawler.PinterestBoardMenu();
}


async function setupbrowser() {
    if(validateURL(url)) {
        let page = await configureBrowser();
        await downloadOnlyBoardImages(page);
    } else {
        rl.close();
        console.log(chalk.red("Error occurred while fetching url. Please make sure to enter correct url.."));
        DownloadPintrestBoard(browser);
    }

};


var downloadImageToUrl = (url, filename, callback) => {

    var client = http;
    if (url.toString().indexOf("https") === 0){
        client = https;
    }
    client.request(url, function(response) {
        var data = new Stream();

        response.on('data', function(chunk) {
            data.push(chunk);
        });

        response.on('end', function() {
            fsPath.writeFileSync(filename, data.read());
        });
    }).end();
};

var DownloadPintrestBoard = function(browserInstance) {
    rl = readline.createInterface({
        input: process.stdin,
        output: process.stdout
    });
    if(browserInstance!=null)
        browser = browserInstance;
    rl.question("Please enter the Pinterest's board url:", function (boardUrl) {
        url = boardUrl.toString();
        setupbrowser();
    })
}

// validates if the user has entered correct url
function validateURL(str) {
    var pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
        '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
        '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
        '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
        '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
        '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
    if(!!pattern.test(str)) {
        if(str.includes("pinterest")==1) {
            return true;
        } else {
            return false;
        }
    } else {
        return false;
    }
}

module.exports = function (parent) {
    return pinterestmCrawler = {
        // called by parent file mainMenu.js
        DownloadPinterestBoardLaunch: function(browser) {
            DownloadPintrestBoard(browser);
        },
        PinterestBoardMenu: function () {
            rl.question("What would you like to do now. \n" +
                " 1. Download images from different board. \n" +
                " 2. Go back to main Menu. \n" +
                " 3. Quit Application. \n" +
                " Enter the following Keys... \n", function (choice) {
                console.clear();
                switch (choice){
                    case '1': {
                        rl.close();
                        DownloadPintrestBoard();
                        break;
                    }
                    case '2':{
                        rl.close();
                        parent.chooseInstagramOrPinterest(browser);
                        break;
                    }
                    case '3':{
                        rl.close();
                        process.exit();
                        break;
                    }
                    default:
                        pinterestmCrawler.PinterestBoardMenu();
                }
            })
        }
    };
}