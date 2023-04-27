import axios from 'axios';
// import puppeteer  from 'puppeteer';
// import fs from 'fs';
// import path from 'path'
import AWS from 'aws-sdk';

// Set the region 
AWS.config.update({region: 'ap-southeast-1'});

const Rekog_API = 'https://1dgha3g9nb.execute-api.ap-southeast-1.amazonaws.com/test/label'
const DDB_Table = 'AllieDiagrams2'
const Rekog_API_get_service = "https://emdnx5w672.execute-api.us-west-2.amazonaws.com/prod/search"

// Create the DynamoDB service object
var ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});

// function getResFromRekog(img_url="https://d2908q01vomqb2.cloudfront.net/fc074d501302eb2b93e2554793fcaf50b3bf7291/2022/01/05/1.png") {

// function getResFromRekog(img_url) {
//     // Get response from Rekognition API
//     // Param: arch img url

//     return axios.post(Rekog_API, {
//         "url": img_url
//     }).then((res)=> {
//         let data = res.data;
//         var Rekog_labels = new Set()
//         var Rekog_text_services = new Set()
//         var Rekog_text_metadata = new Set()
//         data.labels.forEach(element => {
//             Rekog_labels.add(element.Name)
//         });
//         data.text.forEach(element=>{
//             if (element.DetectedText.includes("AWS") || element.DetectedText.includes("Amazon")) {
//                 Rekog_text_services.add(element.DetectedText)
//             }
//             else{
//                 Rekog_text_metadata.add(element.DetectedText)
//             }
//         })
//         Rekog_text_services.delete("AWS")
//         Rekog_text_services.delete("Amazon")
//         return {"labels":Rekog_labels,
//                 "textServices":Rekog_text_services, 
//                 "textMetadata":Array.from( Rekog_text_metadata).join(', ')}

//     })
//     .catch((error) =>console.error(error));
// }
    
// function getResFromRekogHighConf(img_url="https://d2908q01vomqb2.cloudfront.net/fc074d501302eb2b93e2554793fcaf50b3bf7291/2022/01/05/1.png") {
function getResFromRekogHighConf(img_url) {
    // Get response from Rekognition API
    // Param: arch img url

    return axios.post(Rekog_API, {
        "url": img_url
    }).then((res)=> {
        let data = res.data;
        var Rekog_labels = new Set()
        var Rekog_text_services = new Set()
        var Rekog_text_metadata = new Set()
        data.labels.forEach(element => {
            if (element.Confidence >= 40)
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
        return {"labels":Rekog_labels,
                "textServices": Rekog_text_services, 
                "textMetadata":Array.from( Rekog_text_metadata).join(', ')}

    })
    .catch((error) =>console.error(error));
}
   
function put2Dynamo(originUrl, publishDate, arch_img_url, crawler_data, rekog_data, ref_links,title, table = DDB_Table){
        console.log("WRITE TO DDB: ")
        console.log("originUrl :   ", originUrl)
        console.log("publishDate:  ", publishDate)
        console.log("arch_img_url: ", arch_img_url)
        var write_params = {
            TableName: table,
            Item: {
                'OriginURL': {S: originUrl  },
                'PublishDate': {S: formatDate(publishDate)},
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
                                    S:  Array.from( rekog_data.labels).join(', ')
                                },
                                "textServices": {
                                    S:  Array.from( rekog_data.textServices ).join(', ')
                                },
                                "textMetadata": {
                                    S: rekog_data.textMetadata
                                }
                            }
                        }
                    }
                },
                'Reference': ref_links,
                'Title':{
                    S : title
                }
            }
        };
        console.log("write_params: \n-------------\n", write_params)
        // Call DynamoDB to add the item to the table
        ddb.putItem(write_params, function(err, data) {
        if (err) {
            console.log("*** ddb Error", err);
        } else {
            console.log("Successfuly inserted in DDB", data);
        }
        });    
}




// function put2DynamoWithoutRekog(originUrl, publishDate, arch_img_url, crawler_data, ref_links, title, table = DDB_Table){
//         var write_params = {
//             TableName: table,
//             Item: {
//                 'OriginURL': {S:originUrl  },
//                 'PublishDate': {S: formatDate(publishDate)},
//                 'ArchitectureURL': {
//                     S: arch_img_url
//                 },
//                 'Metadata' :{
//                     M: {
//                         'crawler' : {
//                             S: crawler_data
//                         },
//                         'Rekognition': {
//                             M:{
//                                 "labels": {
//                                     S: ""
//                                 },
//                                 "textServices": {
//                                     S: ""
//                                 },
//                                 "textMetadata": {
//                                     S: ""
//                                 }
//                             }
//                         }
//                     }
//                 },
//                 'Reference': ref_links,
//                 'Title':{
//                     S : title
//                 }
//             }
//         };
        
//         // Call DynamoDB to add the item to the table
//         ddb.putItem(write_params, function(err, data) {
//         if (err) {
//             console.log("Error", err);
//         } else {
//             console.log("Success", data);
//         }
//         });    
// }



function formatDate(date){
        return date.replace("+0000", "+00:00")
}


function getRef(service_name) {
    // Return the Reference for the service

    service_name = service_name.toLowerCase()
    service_name = service_name.replace("aws", "")
    service_name = service_name.replace("amazon", "")
    service_name = service_name.replace("-", " ")


    let ref_4_service_api = Rekog_API_get_service;
    console.log("QueryText : ", service_name)
    return axios.post(ref_4_service_api, 
            {"QueryText": service_name,
                "PageNumber": 1,
                "PageSize": 10,
                "Locale": "en_us",
                "Previous": ""}
    ).then(function(response) {
        // console.log(response.data)
        if (response!= undefined &&  response.data != undefined && response.data.ResultItems[0]!= undefined && response.data.ResultItems[0].DocumentURI != undefined){
            let ref_link = response.data.ResultItems[0].DocumentURI
            // console.log(ref_link)
            return ref_link
        }
        else
            return "not found"

    }).catch(function(error) {
        console.log(error)
    })
}


async function getRefList(list_service_1, list_service_2)
{
    list_service_1 = Array.from(list_service_1)
    list_service_2 = Array.from(list_service_2)

    var all_ref_links = new Set()
    var service_link_list = []
    console.log("list serice 1 :\n", list_service_1)
    for (let index = 0; index < list_service_1.length; index++) {
        let service_name = list_service_1[index];
        console.log("service_name : ", service_name)
        service_name = service_name.trim();

        if (service_name == "")
            continue
        let ref = await getRef(service_name)
        
        if (!all_ref_links.has(ref)){
            service_link_list.push({
                M: {
                    "service":{
                        S: service_name
                    },
                    "link":{
                        S: ref
                    }  
                }
            })  

            all_ref_links.add(ref)
        }
    }

    console.log("list serice 2 :\n", list_service_2)
    for (let index = 0; index < list_service_2.length; index++) {
        let service_name = list_service_2[index];
        let ref = await getRef(service_name)
        if (!all_ref_links.has(ref)){
            service_link_list.push({
                M: {
                    "service":{
                        S: service_name
                    },
                    "link":{
                        S: ref
                    }  
                }
            }) 
            all_ref_links.add(ref)
        }
    }
    return service_link_list
}

export { put2Dynamo, getResFromRekogHighConf, getRefList}

