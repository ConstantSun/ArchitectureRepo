const axios = require('axios');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { title } = require('process');

let api = "https://aws.amazon.com/api/dirs/items/search?item.directoryId=solutions-master&sort_by=item.additionalFields.sortDate&sort_order=desc&size=10&item.locale=en_US"

function getURLs() {
    // Return a list of URLs

    return axios.get(api).then((response) => {
        data = response.data.items;
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
    success = URLs
    if (success){
        console.log("Crawling imgs completed");
        console.log(success[4])
    }
    else
        console.log("Unable to crawl imgs");
    

    (async () => {
        const browser = await puppeteer.launch();
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
            //filter1 = images.filter(img => img.includes("d2908q01vomqb2.cloudfront.net"))
            filter2 = images.filter( function(img){
                return img.includes("arc") || img.includes("rchitecture") || img.includes("diagram")
            }) ;
            filter = Array.from(new Set(filter2));

            if (filter2.length > 0) 
            {
                //console.log(filter);
                const metadata = await page.title();
                //console.log(metadata)
                //for (let index = 0; index < metadata.length; index++) {
                    //const element = metadata[index];
                    //let value = await element.evaluate(el => el.textContent, element)
                    //console.log("value:");
                    //console.log(value);      
                    //articleSection.push(value);             
                //}
                arcImg_and_metadata.push([blogURL, dateUpdated, filter, metadata])
            }
            
        }
        fs.writeFileSync("./arcImg_and_metadata_sollib_1.json", JSON.stringify(arcImg_and_metadata));
        await browser.close();
    })();
} 

crawlImgs();
