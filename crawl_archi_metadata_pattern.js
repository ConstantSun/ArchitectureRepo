import axios from 'axios';
import puppeteer  from 'puppeteer';
import fs from 'fs';
import { put2DynamoWithoutRekog, getRef } from "./shared_funcs.js";



let api = "https://aws.amazon.com/api/dirs/items/search?item.directoryId=alias%23architecture-center&sort_by=item.additionalFields.sortDate&sort_order=desc&size=311&item.locale=en_US&tags.id=GLOBAL%23content-type%23pattern"
function getURLs() {
    // Return a list of URLs

    return axios.get(api).then((response) => {
        var data = response.data.items;
        console.log(`RESPONSE:\n`);
        let blogLists = [];
        let count = 0;
        data.forEach(blog => {
            blogLists.push([blog["item"]["additionalFields"]["headlineUrl"], blog["item"]["dateUpdated"]]);

            // console.log(blog["item"]["additionalFields"]["link"]);
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
    let success = URLs
    if (success){
        console.log("Crawling imgs completed");
        console.log(success[4])
    }
    else
        console.log("Unable to crawl imgs");
    

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
            await page.goto(blogURL);
        
            // Get img 
            const images = await page.evaluate(() => Array.from(document.images, e => e.src));
            var filter1 = images.filter(img => img.includes("patterns"))

            // Get title
            const title = await page.title();

            // Get metadata
            if (images.length > 0 && filter1.length == 1) 
            {
                const result = await page.evaluate(() => {
                    const table = document.querySelector('table tbody');
                    const columns = table.querySelectorAll('tr td');
                    return Array.from(columns, column => column.innerText);
                    
                });
                arcImg_and_metadata.push([blogURL, dateUpdated, filter1, result])

                let crawler_data = ""
                let service_refs = ""
                let service_list = []
                console.log("result: ", result)
                result.forEach(element => {
                    crawler_data = crawler_data + element.substring(element.indexOf(":")+1) + " ; "
                    if (element.substring(0,12) == "AWS services") {
                        let tem = element.substring(element.indexOf(":")+1)
                        service_list = tem.split(";")
                    }
                });
                console.log("crawler_data: ", crawler_data)
                console.log("service list: ", service_list)
                var all_ref_links = []
                for (let index = 0; index < service_list.length; index++) {
                    const element = service_list[index];
                    let ref_link = await getRef(element) 
                    all_ref_links.push({
                        M: {
                            "service":{
                                S: element
                            },
                            "link":{
                                S: ref_link
                            }  
                        }
                    })                     
                }
                console.log("ref: ", all_ref_links)
                
                put2DynamoWithoutRekog(blogURL, dateUpdated, filter1[0], crawler_data, {L: all_ref_links}, title)
            }
            
        }
        fs.writeFileSync("./crawler_res/arcImg_and_metadata_pattern_1.json", JSON.stringify(arcImg_and_metadata));
        await browser.close();
    })();
} 

crawlImgs();

