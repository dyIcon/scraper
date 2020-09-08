const puppeteer = require('puppeteer');
process.env['NODE_TLS_REJECT_UNAUTHORIZED'] = 0
const https=require('https');
const fs=require('fs');
var URL = require('url');

const chrome_exe = String.raw`${process.env["ProgramFiles(x86)"]}\Google\Chrome\Application\chrome.exe`;
const user_data_path = String.raw`${process.env.LocalAppData}\Google\Chrome\User Data\Default`;

// const userCookie = 'DDS_token:0GWPqhhtmb04vp0pCZZvPo5Jyj8JMtqYZjKPhJnXo7y-P-eNsCDgETh8g05FLLKXjcyP1yKO4k1dbM9ewT9Taw0Ol4nkw1-GIjPCHlLBsq_9AbL3XsFBpVrYJGu7HjBA-C9a-ts2dzNcqTPq0LxQjsWc8Sl-c677MJ6akM-wCYjNe1wXTORT5a1yilvrK1y4MMiVI2CycDsZVcWzADpAS-zN1HNRtJuc9sxK40DKO-jqeiNgS0NK30S5_cFxGF_F';

const source = {
    url:'https://a.douyu.tv/index.html',
    name:'斗鱼-企业门户'
};

//存储爬取信息
var crawData = {};

crawData[source.name]= source.url;

async function run(url) {
    const browser = await puppeteer.launch({
        headless: false,
        timeout: 50000,
        devtools: false,
        userDataDir: user_data_path,
        executablePath: chrome_exe
    });
    const page = await browser.newPage();
    page.setViewport({ width: 1920, height: 1080 });
    await page.goto(url, { waitUntil: 'networkidle0' });

    // page.goto(url).then(()=>{
    //     page.evaluate(()=>document.cookie = 'guy=mograbi; path=/');  
    // });

    // const cookies = [{
    //     'DDS_token':'0GWPqhhtmb04vp0pCZZvPo5Jyj8JMtqYZjKPhJnXo7y-P-eNsCDgETh8g05FLLKXjcyP1yKO4k1dbM9ewT9Taw0Ol4nkw1-GIjPCHlLBsq_9AbL3XsFBpVrYJGu7HjBA-C9a-ts2dzNcqTPq0LxQjsWc8Sl-c677MJ6akM-wCYjNe1wXTORT5a1yilvrK1y4MMiVI2CycDsZVcWzADpAS-zN1HNRtJuc9sxK40DKO-jqeiNgS0NK30S5_cFxGF_F',
    //     'expires':1599579321,
    // }];

    // await page.setCookie(...cookies);
    // const cookiesSet = await page.cookies(url);
    // console.log(JSON.stringify(cookiesSet));
    // 直接爬首页所有的titles
    var titles = await page.evaluate(getTitles);
    console.log(titles);
    // 把首页爬取的结果push进crawData数组
    data2Craw(titles);
    const titleQueue =  [];
    //将首页结果放入queue里
    for(var key in crawData){
        if (URL.parse(crawData[key]).hostname === URL.parse(source.url).hostname){
            titleQueue.push({item:crawData[key]});
        }
    }
    //当titleQueue里为空时，停止爬取
    while(titleQueue.length){
        const top =titleQueue.pop();
        const titleUrl = Object.values(top)[0];
        await page.waitFor(1000);
        await page.goto(titleUrl, { waitUntil: 'networkidle0' });
        var titleList = await page.evaluate(getTitles);
        var newTitles = titleList.map(item => {
            const url = item.href;
            var title = item.text; 

            console.log("这是新的打印");
            console.log(title);
            var pattern = new RegExp("\/download");
            if(crawData[title]){
                if(crawData[title] !== url){
                    title = source.name + " - " + title;
                    //去重后crawData
                    if (pattern.test(source.url) && URL.parse(url).hostname === URL.parse(source.url).hostname){
                        titleQueue.push({title:url});
                    }
                    crawData[title] = url;
                }

            }else{
                if (pattern.test(source.url) && URL.parse(url).hostname === URL.parse(source.url).hostname){
                    titleQueue.push({title:url});
                }
                crawData[title] = url;
            }
        });
    }
    
    process.on('unhandledRejection', (reason, p) => {
        console.log('Unhandled Rejection at: Promise', p, 'reason:', reason);
        // application specific logging, throwing an error, or other logic here
      });

    // 删除data.json ，并将新data写入json file
    fs.unlinkSync('scraperData.json');
    await page.waitFor(1000);
    fs.writeFileSync('scraperData.json', JSON.stringify(crawData));

};

//获取当前页面所有的<a> title和url
function getTitles() {
    document.cookie = 'DDS_token:0GWPqhhtmb04vp0pCZZvPo5Jyj8JMtqYZjKPhJnXo7y-P-eNsCDgETh8g05FLLKXjcyP1yKO4k1dbM9ewT9Taw0Ol4nkw1-GIjPCHlLBsq_9AbL3XsFBpVrYJGu7HjBA-C9a-ts2dzNcqTPq0LxQjsWc8Sl-c677MJ6akM-wCYjNe1wXTORT5a1yilvrK1y4MMiVI2CycDsZVcWzADpAS-zN1HNRtJuc9sxK40DKO-jqeiNgS0NK30S5_cFxGF_F';
    var titles = $('a');
    var title = titles.map((i, a) => ({
        text: a.innerHTML,
        href: a.href || ''
    })).get();
    console.log(title);
    return title;
} 

function data2Craw(data) {
    var dataset = data.map(item => {
        if(crawData[item.text] && crawData[item.text] !== item.href){
            crawData[source.name + " - " + item.text] = item.href;
        }else{
            crawData[item.text] = item.href;
        }
    });
}

run(source.url);
