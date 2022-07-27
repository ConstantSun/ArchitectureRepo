const axios = require('axios');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { title } = require('process');
var AWS = require('aws-sdk');

// Set the region 
AWS.config.update({region: 'ap-southeast-1'});

// Create the DynamoDB service object
var ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});


// got 200 items for ddb
let api = "https://aws.amazon.com/api/dirs/items/search?item.directoryId=alias%23architecture-center&sort_by=item.additionalFields.sortDate&sort_order=desc&size=311&item.locale=en_US&tags.id=GLOBAL%23content-type%23pattern"

function getResFromRekog(img_url="https://d2908q01vomqb2.cloudfront.net/fc074d501302eb2b93e2554793fcaf50b3bf7291/2022/01/05/1.png") {
    // Get response from Rekognition API
    // Param: arch img url

    return axios.post('https://6pm97xomk2.execute-api.ap-southeast-1.amazonaws.com/dev/api/url-label', {
        "url": img_url
    }).then((res)=> {
        let data = res.data;
        Rekog_labels = new Set()
        Rekog_text_services = new Set()
        Rekog_text_metadata = new Set()
        data.labels.forEach(element => {
            Rekog_labels.add(element.Name)
        });
        data.text.forEach(element=>{
            if (element.DetectedText.includes("AWS") || element.DetectedText.includes("Amazon")) {
                Rekog_text_services.add(element.DetectedText)
            }
            else{
                Rekog_text_metadata.add(element.DetectedText)
            }
        })
        Rekog_text_services.delete("AWS")
        Rekog_text_services.delete("Amazon")
    
        return {"labels":Array.from(Rekog_labels).join(', '),
                "textServices": Array.from(Rekog_text_services).join(', '), 
                "textMetadata":Array.from( Rekog_text_metadata).join(', ')}

    })
    .catch((error) =>console.error(error));
} ;


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


function put2Dynamo(originUrl, publishDate, arch_img_url, crawler_data, rekog_data)
{
    var write_params = {
        TableName: 'AllieDiagrams',
        Item: {
            'OriginURL': {S:originUrl  },
            'PublishDate': {S: publishDate},
            'ArchitectureURL': {
                S: arch_img_url
            },
            'Metadata' :{
                M: {
                    'crawler' : {
                        S: crawler_data
                    },
                    'Rekognition': {
                        M:{
                            "labels": {
                                S: rekog_data.labels
                            },
                            "textServices": {
                                S: rekog_data.textServices
                            },
                            "textMetadata": {
                                S: rekog_data.textMetadata
                            }
                        }
                    }
                }
            }
        }
    };
      
    
    // Call DynamoDB to add the item to the table
    ddb.putItem(write_params, function(err, data) {
    if (err) {
        console.log("Error", err);
    } else {
        console.log("Success", data);
    }
    });    
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
        const browser = await puppeteer.launch({
            executablePath: '/usr/bin/chromium-browser'
          });
        const page = await browser.newPage();

        arch_img_list = []
        arcImg_and_metadata = []

        var count_img = 0 
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
                if (filter1.length > 1)
                    count_img = count_img + 1
                console.log("count = ", count_img)
                console.log(arcImg_and_metadata[arcImg_and_metadata.length - 1])
            }
        }
        
        console.log("there are ", count_img, " / ", URLs.length)
        fs.writeFileSync("./crawler_res/arcImg_and_metadata_pattern_1.json", JSON.stringify(arcImg_and_metadata));
        await browser.close();
    })();
} 

crawlImgs();
