
const $ = require('cheerio');
const https = require('https');
const http = require('http');
const chalk = require('chalk');
const readline = require("readline");
const fsPath = require('fs-path');
const Stream = require('stream').Transform;
var url = '';
var mainMenu = require.main;
var rl;
var browser;

module.exports = function (parent) {
    return InstagramCrawlerClass = {
        chooseMenuAfterDownload: function () {
            console.log(chalk.blue(" --- Instagram Crawler Menu ---"))
            rl.question("What would you like to do now. \n" +
                " 1. Download Other Image. \n" +
                " 2. Go back to main Menu. \n" +
                " 3. Quit Application. \n" +
                " Enter the following Keys... \n", function (choice) {
                switch (choice){
                    case '1': {
                        rl.close();
                        console.clear();
                        InstagramCrawlerClass.DownloadInstagramImage(browser);
                        break;
                    }
                    case '2':{
                        rl.close();
                        parent.chooseInstagramOrPinterest(browser);
                        break;
                    }
                    case '3': {
                        rl.close();
                        process.exit();
                        break;
                    }
                    default:
                        console.clear();
                        InstagramCrawlerClass.chooseMenuAfterDownload();
                }
            })
        },
        DownloadInstagramImage: function (browserInstance) {
            rl = readline.createInterface({
                input: process.stdin,
                output: process.stdout
            });
            if(browserInstance!=null)
                browser = browserInstance;

            rl.question("Please enter the instagram image url:",  (instagramURL) => {
                url = instagramURL.toString();
                InstagramCrawlerClass.setupbrowser(url);
            })
        },
        setupbrowser: async function (url){
            //console.clear();
            console.log("Please wait while we download the image...")
            if(InstagramCrawlerClass.validateURL(url)) {
                let page = await InstagramCrawlerClass.configureBrowser(url);
                await InstagramCrawlerClass.crawlInstagramPage(page);
            } else {
                console.log(chalk.red("Error occurred while fetching url. Please make sure to enter correct url.."));
                rl.close();
                InstagramCrawlerClass.DownloadInstagramImage(browser);
            }

        },
        // validates if the user has entered correct url
        validateURL: function (str) {
            var pattern = new RegExp('^(https?:\\/\\/)?'+ // protocol
                '((([a-z\\d]([a-z\\d-]*[a-z\\d])*)\\.)+[a-z]{2,}|'+ // domain name
                '((\\d{1,3}\\.){3}\\d{1,3}))'+ // OR ip (v4) address
                '(\\:\\d+)?(\\/[-a-z\\d%_.~+]*)*'+ // port and path
                '(\\?[;&a-z\\d%_.~+=-]*)?'+ // query string
                '(\\#[-a-z\\d_]*)?$','i'); // fragment locator
            if(!!pattern.test(str)) {
                if(str.includes("instagram")==1) {
                    return true;
                } else {
                    return false;
                }
            } else {
                return false;
            }
        },
        // configures browser to load url
        configureBrowser: async function () {
            const pages = await browser.pages()
            let page;
            for (let i = 0; i < pages.length && !page; i++) {
                const isHidden = await pages[i].evaluate(() => document.hidden)
                if (!isHidden) {
                    page = pages[i]
                }
            }
            try {
                await page.goto(url);
            }catch (e){
                console.log(chalk.red("Error occurred while fetching url. Please make sure to enter correct url.."));
                rl.close();
                return page;
            }
            return page;
        },
        crawlInstagramPage: async function(page) {
            await page.reload();
            let html = await page.evaluate(() => document.body.innerHTML);
            // console.log(html)
            $('img.FFVAD', html).each(function() {
                //console.log($(this)[0].attribs.src);
                var name = $(this)[0].attribs.alt
                name = name.replace(/. /g,"");
                var url = $($(this)[0].attribs.src.toString());

                // saveImageToDisk(url, './temp.jpeg')
                //download(url, 'image.png');
                const options = {
                    url: $(this)[0].attribs.src,
                    dest: '/'                // will be saved to /path/to/dest/image.jpg
                }
                InstagramCrawlerClass.downloadImageToUrl(options.url,'./'+name+'.png')

            });
        },
        downloadImageToUrl: function (url, filename, callback) {

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
                    fsPath.writeFileSync("downloads/instagram/" + filename, data.read());
                    console.log(chalk.green("Successfully downloaded file:") + filename);
                    InstagramCrawlerClass.chooseMenuAfterDownload();
                });
            }).end();
        }
    }
}