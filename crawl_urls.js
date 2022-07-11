const axios = require('axios');
let api = "https://aws.amazon.com/api/dirs/items/search?item.directoryId=blog-posts&sort_by=item.additionalFields.createdDate&sort_order=desc&size=250&item.locale=en_US&page=3"

function getURLs() {
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
        console.log("count = ", count)
        console.log(blogLists)
        return blogLists
      })
      .catch((error) =>console.error(error));
}

async function crawlImgs(){
    let success = await getURLs()
    if (success){
        console.log("Crawling imgs completed");
        console.log(success[4])
    }
    else
        console.log("Unable to crawl imgs");
} 

crawlImgs();
