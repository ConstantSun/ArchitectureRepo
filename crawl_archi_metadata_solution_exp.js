const axios = require('axios');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { title } = require('process');
var AWS = require('aws-sdk');
const shared_funcs = require('./shared_funcs');

// Set the region 
AWS.config.update({region: 'ap-southeast-1'});

// Create the DynamoDB service object
var ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});


const api =  "https://aws.amazon.com/api/dirs/items/search?item.directoryId=alias%23solutions-experience&sort_by=item.additionalFields.headline&sort_order=asc&size=30&item.locale=en_US&tags.id=!GLOBAL%23flag%23archived&tags.id=!GLOBAL%23year%232016&page="
function getURLs(current_api) {
    // Return a list of URLs

    return axios.get(current_api).then((response) => {
        data = response.data.items;
        console.log(`RESPONSE:\n`);
        let blogLists = [];
        let count = 0;
        data.forEach(blog => {
            blogLists.push([blog["item"]["additionalFields"]["headlineUrl"], blog["item"]["dateUpdated"], blog["item"]["additionalFields"]["techCategory"]]);

            // console.log(blog["item"]["additionalFields"]["link"]);
            count = count + 1;
        });
        console.log("blogLists length = ", blogLists.length)
        // console.log(blogLists)
        return blogLists
      })
      .catch((error) =>console.error(error));
}



async function crawlImgs(current_api){
    // Get a list of URLs
    // Extract arch img from those URLs

    let URLs = await getURLs(current_api)
    success = URLs
    if (success) 
        console.log("Crawling urls completed")
    else
        console.log("Unable to crawl imgs url");
    
    (async () => {
        const browser = await  puppeteer.launch({
            executablePath: '/usr/bin/chromium-browser'
          });
        const page = await browser.newPage();

        arch_img_list = []
        arcImg_and_metadata = []

        for (let index = 0; index < 10; index++) 
        {
            console.log("index: ", index)
            const blogURL = URLs[index][0];
            const dateUpdated = URLs[index][1];
            const metadata = URLs[index][2];
            await page.goto(blogURL);
        
            // Get img 
            const images = await page.evaluate(() => Array.from(document.images, e => e.src));
            filter2 = images.filter( function(img){
                return img.includes("arc") || img.includes("rchitecture") || img.includes("diagram")
            }) ;
            filter3 = Array.from(new Set(filter2));

            if (filter2.length > 0 && filter3.length == 1 ) 
            {
                console.log("filter3: ", filter3);
                //const metadata = await page.query();
                const title = await page.title()
                arcImg_and_metadata.push([blogURL, dateUpdated, filter3, metadata, title])
                console.log("-----\naccepted: ", arcImg_and_metadata.length);
                console.log("arch img: ", filter3)
                console.log("metadata: ", metadata)

                // Rekog and upload to DDB
                const Rekog = await shared_funcs.getResFromRekog(filter3[0])

                if (Rekog!= undefined){
                    let text_services = Rekog.textServices
                    text_services = text_services.split(",")
                    console.log(text_services)
                    all_ref_links = ""
                    if (text_services.length>=2 )  {
                        for (let index = 0; index < text_services.length; index++) {
                            const element = text_services[index];
                            let ref_link = await shared_funcs.getRef(element)
                            all_ref_links = all_ref_links + "," + element + " : " + ref_link                        
                        }
                        if(Rekog !== undefined){
                            // console.log("** put to ddb")
                            // console.log("datePub: ", dateUpdated)
                            // console.log("metadata: ", metadata)
                            // console.log("Rekog: ", Rekog)
                            // console.log("title: ", title)
                            shared_funcs.put2Dynamo(blogURL, dateUpdated, filter3[0], metadata, Rekog, all_ref_links, title)
                        }
                    }
                }
            }
        }
        console.log("length: ", arcImg_and_metadata.length);
        fs.writeFileSync("./arcImg_and_metadata_sollib_4.json", JSON.stringify(arcImg_and_metadata));
        await browser.close();
    })();
} 

var index = 9
// for (let index = 11; index >= 0; index--) {
    let current_api = api + index;
    console.log(":: ", current_api)
    crawlImgs(current_api);
    
// }