import axios from "axios";
import puppeteer from "puppeteer";
// import fs from "fs";
import { put2Dynamo, getResFromRekogHighConf, getRefList } from "./shared_funcs.js";

const urls_size = 50
const api =
    `https://aws.amazon.com/api/dirs/items/search?item.directoryId=blog-posts&sort_by=item.additionalFields.createdDate&sort_order=desc&size=${urls_size}&item.locale=en_US&page=1`;
const URL_PATTERN = "d2908q01vomqb2.cloudfront.net"

function getURLs() {
    // Return a list of URLs
    return axios
        .get(api)
        .then((response) => {
            var data = response.data.items;
            console.log("RESPONSE:");
            // Solved & Tested: Feedback. Instead of using a foreach loop, you could use a map function and just return the array
            const blogLists = data.map(blog => [blog.item.additionalFields.link, blog.item.dateUpdated])
            return blogLists;
        })
        .catch((error) => console.error(error));
}    


// Solved: Feedback - make this a proper function, try to avoid in-method functions like this
async function crawl_from_url(urls) {    
    const browser = await puppeteer.launch({
        executablePath: "/usr/bin/chromium-browser",
    });
    // const browser = await puppeteer.launch();

    const page = await browser.newPage();

    let numOfValidArchUrls = 0;

    // x Feedback - the cyclomatic complexity of this is high, considering breaking it down into logical methods
    for (let index = 0; index < urls.length; index++) {
        console.log("index: ", index);
        let blogURL = urls[index][0];
        let dateUpdated = urls[index][1];

        await page.goto(blogURL);
        console.log("blogUrl:", blogURL);
        console.log("date:", dateUpdated);

        // Get img
        const images = await page.evaluate(() => Array.from(document.images, (e) => e.src));
        const filter1 = images.filter((img) => img.includes(URL_PATTERN));
        console.log("all imgs:", filter1);

        // Solved: Feedback - Change this from 'index' to another variable name. Don't reused nested variables like this
        // the outer for loop also uses 'index' and you may get weirdness
        for (let index_1 = 0; index_1 < filter1.length; index_1++) { // Loop through each image and stop when found image which is an architecture diagram
            let flag = false;
            const element = filter1[index_1];

            const rekog = await getResFromRekogHighConf(element); 
            console.log("Rekog response: \n", rekog)
            if (rekog) {
                if (rekog.labels.size >= 2) {
                    flag = true;
                    console.log("Rekog.labels.size = ", rekog.labels.size);
                    console.log("Selected img url  = ", element);

                    let articleSection = [];
                    let metadata = await page.$$('span[property="articleSection"]');

                    for (let i = 0; i < metadata.length; i++) {
                        const element = metadata[i];
                        const value = await element.evaluate((el) => el.textContent, element);
                        console.log("value: ", value);
                        articleSection.push(value);
                    }

                    const title = await page.title();
                    const allRefLinks = await getRefList(rekog.labels, rekog.textServices);

                    numOfValidArchUrls = numOfValidArchUrls + 1;

                    put2Dynamo(
                        blogURL,
                        dateUpdated,
                        element,
                        articleSection.toString(),
                        rekog,
                        { L: allRefLinks },
                        title
                    );

                    console.log("numOfValidArchUrls = ", numOfValidArchUrls);
                }
            }
            if (rekog && rekog.labels.size >= 2) {
                break;
            }
        }
    }
    console.log("valid arch : ", numOfValidArchUrls);
    // fs.writeFileSync("./crawblog.json", JSON.stringify({ "valid arch": numOfValidArchUrls }));
    await browser.close();
}


async function crawlImgs() {
    // Get a list of URLs
    // Extract architecture img from those URLs
    const urls = await getURLs(api);

    if (urls) console.log("Crawling urls completed");
    // Solved: Feedback - Should this early exit?
    else {
        console.log("Unable to crawl imgs");
        return;
    }
    await crawl_from_url(urls);

}



crawlImgs();
