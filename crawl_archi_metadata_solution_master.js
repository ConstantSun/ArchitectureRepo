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


let api = "https://aws.amazon.com/api/dirs/items/search?item.directoryId=solutions-master&sort_by=item.additionalFields.sortDate&sort_order=desc&size=350&item.locale=en_US"

function getURLs() {
    // Return a list of URLs

    return axios.get(api).then((response) => {
        data = response.data.items;
        console.log(`RESPONSE:\n`);
        let blogLists = [];
        let count = 0;
        data.forEach(blog => {
            blogLists.push([blog["item"]["additionalFields"]["headlineUrl"], blog["item"]["dateUpdated"]]);
            count = count + 1;
        });
        console.log("blogLists length = ", blogLists.length)
        // console.log(blogLists)
        return blogLists
      })
      .catch((error) =>console.error(error));
}


async function crawlImgs(){
    // Get a list of URLs
    // Extract arch img from those URLs

    let URLs = await getURLs()
    success = URLs
    if (success) 
        console.log("Crawling urls completed")
    else
        console.log("Unable to crawl imgs url");
    
    (async () => {
        const browser = await puppeteer.launch({
            executablePath: '/usr/bin/chromium-browser'
          });
        const page = await browser.newPage();

        arch_img_list = []
        arcImg_and_metadata = []

        for (let index = 0; index < URLs.length; index++) 
        {
            console.log("index: ", index)
            const blogURL = URLs[index][0];
            const dateUpdated = URLs[index][1];
            await page.goto(blogURL);
        
            // Get img 
            const images = await page.evaluate(() => Array.from(document.images, e => e.src));
            filter2 = images.filter( function(img){
                return img.includes("arc") || img.includes("rchitecture") || img.includes("diagram")
            }) ;
            filter = Array.from(new Set(filter2));

            if (filter2.length > 0) 
            {
                //console.log(filter);
                const metadata = await page.title();
                arcImg_and_metadata.push([blogURL, dateUpdated, filter, metadata])
                console.log("accepted: ", arcImg_and_metadata.length);

                const Rekog = await shared_funcs.getResFromRekog(filter2[0])
                console.log("Rekog res:")
                console.log(Rekog)
                if (Rekog!= undefined){
                    text_services = Rekog.textServices
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
                            shared_funcs.put2Dynamo(blogURL, dateUpdated, filter2[0], metadata, Rekog, all_ref_links)
                        }
                    }
                }
            }
        }
        console.log("length: ", arcImg_and_metadata.length);
        fs.writeFileSync("./arcImg_and_metadata_sol_master.json", JSON.stringify(arcImg_and_metadata));
        await browser.close();
    })();
} 

crawlImgs();
