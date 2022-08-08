// import axios from 'axios';
// import puppeteer  from 'puppeteer';
// import fs from 'fs';
// import { put2Dynamo, getResFromRekog, getRef, getRefList } from "./shared_funcs.js";


// const api = "https://aws.amazon.com/api/dirs/items/search?item.directoryId=blog-posts&sort_by=item.additionalFields.createdDate&sort_order=desc&size=2000&item.locale=en_US&page=1"
// function getURLs() {
//     // Return a list of URLs

//     return axios.get(api).then((response) => {
//         var data = response.data.items;
//         console.log(`RESPONSE:\n`);
//         let blogLists = [];
//         let count = 0;
//         data.forEach(blog => {
//             blogLists.push([blog["item"]["additionalFields"]["link"], blog["item"]["dateUpdated"]]);
//             count = count + 1;
//         });
//         console.log("blogLists length = ", blogLists.length)
//         // console.log(blogLists)
//         return blogLists
//       })
//       .catch((error) =>console.error(error));
// }

// async function crawlImgs(){
//     // Get a list of URLs
//     // Extract arch img from those URLs

//     let URLs = await getURLs(api);
//     var success = URLs
//     if (success) console.log("Crawling urls completed");
//     else console.log("Unable to crawl imgs");
    

//     (async () => {
//         const browser = await puppeteer.launch({
//             executablePath: '/usr/bin/chromium-browser'
//           });
//         const page = await browser.newPage();

//         var  arch_img_list = []
//         var arcImg_and_metadata = []
//         var num_of_valid_arch_urls = 0

//         for (let index = 0; index < URLs.length; index++) 
//         {
//             console.log("index: ", index)
//             let blogURL = URLs[index][0];
//             let dateUpdated = URLs[index][1];
//             console.log("page = ", blogURL)
//             await page.goto(blogURL);
//             // console.log("blogUrl:", blogURL);
//             // console.log("date:", dateUpdated);
//             // Get img 
//             const images = await page.evaluate(() => Array.from(document.images, e => e.src));
//             var filter1 = images.filter(img => img.includes("d2908q01vomqb2.cloudfront.net"))
//             var filter2 = filter1.filter( function(img){
                
//                 return img.includes("arc") || img.includes("rchitecture") || img.includes("diagram")
//             }) ;

//             if (filter2.length > 0) 
//             {
//                 console.log(filter2);

//                 // Get articleSection (metadata)
//                 var articleSection = []
//                 let metadata = await page.$$('span[property="articleSection"]')
//                 for (let i = 0; i < metadata.length; i++) {
//                     const element = metadata[i];
//                     let value = await element.evaluate(el => el.textContent, element)
//                     console.log("value:");
//                     console.log(value);      
//                     articleSection.push(value);             
//                 }
//                 const title = await page.title();
//                 const Rekog = await getResFromRekog(filter2[0])
//                 if ( Rekog!= undefined){
//                     const all_ref_links = await getRefList(Rekog.labels, Rekog.textServices)
//                     if(all_ref_links.length >= 2){
//                         console.log("all ref links: \n", all_ref_links)
                     
//                         num_of_valid_arch_urls = num_of_valid_arch_urls + 1
//                         put2Dynamo(URLs[index][0], URLs[index][1], filter2[0], articleSection.toString(), Rekog, {L: all_ref_links}, title, "test")
//                     }
//                 }
//                 if (num_of_valid_arch_urls == 500)
//                     break
//             }
//         }
//         num_valid_res_blog = {"valid arch": num_of_valid_arch_urls}
//         console.log("valid arch : ", num_of_valid_arch_urls)
//         fs.writeFileSync("./crawblog.json", JSON.stringify(num_valid_res_blog));
//         await browser.close();
//     })();
// } 

// crawlImgs();
