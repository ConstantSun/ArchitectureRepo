import axios from 'axios';
import puppeteer  from 'puppeteer';
import fs from 'fs';
import { put2Dynamo, getResFromRekog, getRef, getRefList } from "./shared_funcs.js";


let api = "https://aws.amazon.com/api/dirs/items/search?item.directoryId=solutions-master&sort_by=item.additionalFields.sortDate&sort_order=desc&size=350&item.locale=en_US"

function getURLs() {
    // Return a list of URLs

    return axios.get(api).then((response) => {
        var data = response.data.items;
        console.log(`RESPONSE:\n`);
        let blogLists = [];
        let count = 0;
        data.forEach(blog => {
            blogLists.push([blog["item"]["additionalFields"]["headlineUrl"], blog["item"]["dateUpdated"], blog["item"]["additionalFields"]["category"]]);
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
    var success = URLs
    if (success) 
        console.log("Crawling urls completed")
    else
        console.log("Unable to crawl imgs url");
    
    (async () => {
        const browser = await puppeteer.launch({
            executablePath: '/usr/bin/chromium-browser'
          });
        const page = await browser.newPage();

        var arch_img_list = []
        var arcImg_and_metadata = []

        for (let index = 0; index < URLs.length; index++) 
        {
            console.log("index: ", index)
            const blogURL = URLs[index][0];
            const dateUpdated = URLs[index][1];
            const metadata = URLs[index][2];
            await page.goto(blogURL);
        
            // Get img 
            const images = await page.evaluate(() => Array.from(document.images, e => e.src));
            var filter2 = images.filter( function(img){
                return img.includes("arc") || img.includes("rchitecture") || img.includes("diagram")
            }) ;
            var filter = Array.from(new Set(filter2));

            if (filter2.length > 0) 
            {
                //console.log(filter);
                const title = await page.title();
                arcImg_and_metadata.push([blogURL, dateUpdated, filter, metadata, title])
                console.log("accepted: ", arcImg_and_metadata.length);

                const Rekog = await getResFromRekog(filter2[0])
                console.log("Rekog res:")
                console.log(Rekog)
                if (Rekog!= undefined){
                    const all_ref_links = await getRefList(Rekog.labels, Rekog.textServices)
                    if(all_ref_links.length >= 2){
                        console.log("all ref links: \n", all_ref_links)
                        put2Dynamo(blogURL, dateUpdated, filter2[0], metadata, Rekog, {L: all_ref_links}, title)
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
