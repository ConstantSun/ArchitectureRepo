const axios = require('axios');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

let api = "https://aws.amazon.com/api/dirs/items/search?item.directoryId=blog-posts&sort_by=item.additionalFields.createdDate&sort_order=desc&size=250&item.locale=en_US&page=1"

function getURLs() {
    // Return a list of URLs

    return axios.get(api).then((response) => {
        data = response.data.items;
        console.log(`RESPONSE:\n`);
        let blogLists = [];
        let count = 0;
        data.forEach(blog => {
            blogLists.push([blog["item"]["additionalFields"]["link"], blog["item"]["dateUpdated"]]);
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
        console.log("Crawling urls completed");
        console.log(success[4])
    }
    else
        console.log("Unable to crawl imgs");
    

    (async () => {
        const browser = await puppeteer.launch();
        const page = await browser.newPage();

        arch_img_list = []
        arcImg_and_metadata = []

        for (let index = 0; index < 20; index++) 
        {
            console.log("index: ", index)
            let blogURL = URLs[index][0];
            let dateUpdated = URLs[index][1];
            await page.goto(blogURL);
            // console.log("blogUrl:", blogURL);
            // console.log("date:", dateUpdated);
            // Get img 
            const images = await page.evaluate(() => Array.from(document.images, e => e.src));
            filter1 = images.filter(img => img.includes("d2908q01vomqb2.cloudfront.net"))
            filter2 = filter1.filter( function(img){
                return img.includes("arc") || img.includes("rchitecture") || img.includes("diagram")
            }) ;

            if (filter2.length > 0) 
            {
                console.log(filter2);

                // Get articleSection (metadata)
                articleSection = []
                let metadata = await page.$$('span[property="articleSection"]')
                for (let i = 0; i < metadata.length; i++) {
                    const element = metadata[i];
                    let value = await element.evaluate(el => el.textContent, element)
                    console.log("value:");
                    console.log(value);      
                    articleSection.push(value);             
                }
                arcImg_and_metadata.push([URLs[index][0], URLs[index][1], filter2, articleSection])
            }
            
        }
        fs.writeFileSync("./arcImg_and_metadata_5.json", JSON.stringify(arcImg_and_metadata));
        await browser.close();
    })();
} 

crawlImgs();
