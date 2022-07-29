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


module.exports = {
    getResFromRekog: function(img_url="https://d2908q01vomqb2.cloudfront.net/fc074d501302eb2b93e2554793fcaf50b3bf7291/2022/01/05/1.png") {
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
    },
    
    // getURLs: function(api = "https://aws.amazon.com/api/dirs/items/search?item.directoryId=alias%23architecture-center&sort_by=item.additionalFields.sortDate&sort_order=desc&size=311&item.locale=en_US&tags.id=GLOBAL%23content-type%23pattern") {
    // // Return a list of URLs

    //     return axios.get(api).then((response) => {
    //         data = response.data.items;
    //         console.log(`RESPONSE:\n`, data);
    //         let blogLists = [];
    //         let count = 0;
    //         data.forEach(blog => {
    //             blogLists.push([blog["item"]["additionalFields"]["headlineUrl"], blog["item"]["dateUpdated"]]);

    //             count = count + 1;
    //         });
    //         console.log("------------------------------------blogLists length = ", blogLists.length)
    //         console.log(blogLists)
    //         return blogLists
    //     })
    //     .catch((error) =>console.error(error));
    // },

    put2Dynamo: function(originUrl, publishDate, arch_img_url, crawler_data, rekog_data, ref_links, table = 'test'){
        var write_params = {
            TableName: table,
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
                },
                'Reference': {
                    S : ref_links
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
    },


    put2DynamoWithoutRekog: function(originUrl, publishDate, arch_img_url, crawler_data, ref_links, table = 'AllieDiagrams'){
        var write_params = {
            TableName: table,
            Item: {
                'OriginURL': {S:originUrl  },
                'PublishDate': {S: this.formatDate(publishDate)},
                'ArchitectureURL': {
                    S: arch_img_url
                },
                'Metadata' :{
                    M: {
                        'crawler' : {
                            S: crawler_data
                        }
                    }
                },
                'Reference': {
                    S : ref_links
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
    },

    getRef: function(service_name) {
        // Return the Reference for the service

        service_name = service_name.toLowerCase()
        service_name = service_name.replace("aws", "")
        service_name = service_name.replace("amazon", "")
    
        let ref_4_service_api = "https://emdnx5w672.execute-api.us-west-2.amazonaws.com/prod/search";
        return axios.post(ref_4_service_api, 
                {"QueryText": service_name,
                    "PageNumber": 1,
                    "PageSize": 10,
                    "Locale": "en_us",
                    "Previous": ""}
        ).then(function(response) {
            // console.log(response.data)
            let ref_link = response.data.ResultItems[0].DocumentURI
            console.log(ref_link)
            return ref_link
        }).catch(function(error) {
            console.log(error)
        })
    },

    formatDate: function(date){
        return date.replace("+0000", "+00:00")
    }
   
}
