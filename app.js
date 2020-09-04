const puppeteer = require('puppeteer');
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0
const https=require('https');
const fs=require('fs');

const chrome_exe = String.raw`${process.env["ProgramFiles(x86)"]}\Google\Chrome\Application\chrome.exe`;
const user_data_path = String.raw`${process.env.LocalAppData}\Google\Chrome\User Data\Default`;

// const url='https://a.douyu.tv/index.html';
const source = {
    url:'https://a.douyu.tv/index.html',
    name:'斗鱼门户'
};

var crawData = {};
crawData["斗鱼指南"]= "888";
async function run() {
    const browser = await puppeteer.launch({
        headless: false,
        timeout: 50000,
        userDataDir: user_data_path,
        executablePath: chrome_exe
    });source.url
    const page = await browser.newPage();
    page.setViewport({ width: 1920, height: 1080 });
    await page.goto(source.url, { waitUntil: 'networkidle0' });

        // 爬取所有的titles
        var titles = await page.evaluate(getTitles);
        console.log(titles);

        // 把爬取的结果push进crawData数组
        pushData(titles);

        // 删除data.json ，并将新data写入json file
        fs.unlinkSync('scraperData.json');
        await page.waitFor(1000);
        fs.writeFileSync('scraperData.json', JSON.stringify(crawData));

};

 function getTitles() {
    // var titles = $('.top_nav > ul > li > a, .top_cat > h2 > a, tab_list > li > p > a, .news_list > li > a, .list_item_title > a');
    var titles = $('a');
    var title = titles.map((i, a) => ({
        text: a.innerHTML,
        href: a.href || ''
    })).get();
    console.log(title);
    return title;
} 

function pushData(data) {
    console.log(222);
    var dataset = data.map(item => {
        if(crawData[item.text] && crawData[item.text] !== item.href){
            crawData[source.name + " - " + item.text] = item.href;
        }else{
            crawData[item.text] = item.href;
        }
    });
}

async function sleep(timeout) {
    return new Promise(resolve => setTimeout(resolve, timeout));
}

run();