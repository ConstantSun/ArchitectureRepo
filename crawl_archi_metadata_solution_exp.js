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


let api =  "https://aws.amazon.com/api/dirs/items/search?item.directoryId=alias%23solutions-experience&sort_by=item.additionalFields.headline&sort_order=asc&size=30&item.locale=en_US&tags.id=!GLOBAL%23flag%23archived&tags.id=!GLOBAL%23year%232016&page=1"
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
    if (success) 
        console.log("Crawling urls completed")
    else
        console.log("Unable to crawl imgs url");
    
    (async () => {
        const browser = await  puppeteer.launch({
            executablePath: '/usr/bin/chromium-browser'
          });
        const page = await browser.newPage();

        arch_img_list = []
        arcImg_and_metadata = []

        for (let index = 0; index < 10; index++) 
        {
            console.log("index: ", index)
            const blogURL = URLs[index][0];
            const dateUpdated = URLs[index][1];
            await page.goto(blogURL);
        
            // Get img 
            const images = await page.evaluate(() => Array.from(document.images, e => e.src));
            filter2 = images.filter( function(img){
                return img.includes("arc") || img.includes("rchitecture") || img.includes("diagram")
            }) ;
            filter3 = Array.from(new Set(filter2));

            if (filter2.length > 0) 
            {
                //console.log(filter3);
                const metadata = await page.title();
                arcImg_and_metadata.push([blogURL, dateUpdated, filter3, metadata])
                console.log("-----\naccepted: ", arcImg_and_metadata.length);
                console.log("arch img: ", filter3)
                console.log("metadata: ", metadata)

                // // Rekog and upload to DDB
                // const Rekog = await getResFromRekog(filter2[0])
                // if(Rekog !== undefined){
                //     put2Dynamo(blogURL, dateUpdated, filter2[0], metadata, Rekog)
                // }
            }
        }
        console.log("length: ", arcImg_and_metadata.length);
        fs.writeFileSync("./arcImg_and_metadata_sollib_4.json", JSON.stringify(arcImg_and_metadata));
        await browser.close();
    })();
} 

crawlImgs();
