const axios = require('axios');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { title } = require('process');

let api = "https://aws.amazon.com/api/dirs/items/search?item.directoryId=alias%23architecture-center&sort_by=item.additionalFields.sortDate&sort_order=desc&size=250&item.locale=en_US&tags.id=GLOBAL%23content-type%23pattern"

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
            filter1 = images.filter(img => img.includes("patterns"))

            // Get metadata
            if (images.length > 0) 
            {
                const result = await page.evaluate(() => {
                    const table = document.querySelector('table tbody');
                    const columns = table.querySelectorAll('tr td');
                    return Array.from(columns, column => column.innerText);
                    
                });
                arcImg_and_metadata.push([blogURL, dateUpdated, filter1, result])
            }
            
        }
        fs.writeFileSync("./arcImg_and_metadata_pattern_1.json", JSON.stringify(arcImg_and_metadata));
        await browser.close();
    })();
} 

crawlImgs();
