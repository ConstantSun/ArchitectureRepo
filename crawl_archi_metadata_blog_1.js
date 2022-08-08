import axios from 'axios';
import puppeteer  from 'puppeteer';
import fs from 'fs';
import { put2Dynamo, getResFromRekogHighConf, getRef, getRefList } from "./shared_funcs.js";


const api = "https://aws.amazon.com/api/dirs/items/search?item.directoryId=blog-posts&sort_by=item.additionalFields.createdDate&sort_order=desc&size=2000&item.locale=en_US&page=1"
function getURLs() {
    // Return a list of URLs

    return axios.get(api).then((response) => {
        var data = response.data.items;
        console.log(`RESPONSE:\n`);
        let blogLists = [];
        let count = 0;
        data.forEach(blog => {
            blogLists.push([blog["item"]["additionalFields"]["link"], blog["item"]["dateUpdated"]]);
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

    let URLs = await getURLs(api);
    var success = URLs
    if (success) console.log("Crawling urls completed");
    else console.log("Unable to crawl imgs");
    

    (async () => {
        const browser = await puppeteer.launch({
            executablePath: '/usr/bin/chromium-browser'
          });
        const page = await browser.newPage();

        var  arch_img_list = []
        var arcImg_and_metadata = []
        var num_of_valid_arch_urls = 0

        for (let index = 16; index < URLs.length; index++) 
        {
            console.log("index: ", index)
            let blogURL = URLs[index][0];
            let dateUpdated = URLs[index][1];
            // //test
            // blogURL = "https://aws.amazon.com/blogs/modernizing-with-aws/sql-server-high-availability-amazon-fsx-for-netapp-ontap/"
            console.log("page = ", blogURL)
            await page.goto(blogURL);
            console.log("\n---------------------\nblogUrl:", blogURL);
            console.log("date:", dateUpdated);
            // Get img 
            const images = await page.evaluate(() => Array.from(document.images, e => e.src));
            var filter1 = images.filter(img => img.includes("d2908q01vomqb2.cloudfront.net"))
            console.log("all imgs:\n", filter1)
            for (let index = 0; index < filter1.length; index++) {
                let flag = false
                const element = filter1[index];

                const Rekog = await getResFromRekogHighConf(element);
                if ( Rekog!= undefined){
                    if (Rekog.labels.size >= 2){
                        flag = true;
                        console.log("Rekog.labels.size = ", Rekog.labels.size)
                        console.log("Selected img url  = ", element)
                        var articleSection = []
                        let metadata = await page.$$('span[property="articleSection"]')
                        for (let i = 0; i < metadata.length; i++) {
                            const element = metadata[i];
                            let value = await element.evaluate(el => el.textContent, element)
                            console.log("value:");
                            console.log(value);      
                            articleSection.push(value);             
                        }
                        const title = await page.title();
                        const all_ref_links = await getRefList(Rekog.labels, Rekog.textServices)

                        num_of_valid_arch_urls = num_of_valid_arch_urls + 1

                        put2Dynamo(blogURL, dateUpdated, element, articleSection.toString(), Rekog, {L: all_ref_links}, title, "newblog")

                        console.log("num_of_valid_arch_urls = ", num_of_valid_arch_urls)
                    }
                }
                if ( Rekog!= undefined && Rekog.labels.size >= 2){
                    break
                }
            }

        }
        num_valid_res_blog = {"valid arch": num_of_valid_arch_urls}
        console.log("valid arch : ", num_of_valid_arch_urls)
        fs.writeFileSync("./crawblog.json", JSON.stringify(num_valid_res_blog));
        await browser.close();
    })();
} 

crawlImgs();
