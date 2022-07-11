const axios = require('axios');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');

let api = "https://aws.amazon.com/api/dirs/items/search?item.directoryId=blog-posts&sort_by=item.additionalFields.createdDate&sort_order=desc&size=250&item.locale=en_US&page=3"

function getURLs() {
    // Return a list of URLs

    return axios.get(api).then((response) => {
        data = response.data.items;
        console.log(`RESPONSE:\n`);
        let blogLists = [];
        let count = 0;
        data.forEach(blog => {
            blogLists.push(blog["item"]["additionalFields"]["link"]);
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

        for (let index = 0; index < 100; index++) 
        {
            console.log("index: ", index)
            const blogURL = URLs[index];
                
            await page.goto(blogURL);
        
            const images = await page.evaluate(() => Array.from(document.images, e => e.src));
            filter1 = images.filter(img => img.includes("d2908q01vomqb2.cloudfront.net"))
            filter2 = filter1.filter( function(img){
                return img.includes("arc") || img.includes("rchitecture")
            }) ;
            if (filter2.length > 0) {
                console.log(filter2);
            }
            arch_img_list.push.apply(arch_img_list, filter2)
            
        }
        fs.writeFileSync("./arch_img_list_01.json", JSON.stringify(arch_img_list));
        await browser.close();
    })();
} 

crawlImgs();
