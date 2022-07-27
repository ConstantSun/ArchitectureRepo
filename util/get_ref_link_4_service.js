const axios = require('axios');
const puppeteer = require('puppeteer');
const fs = require('fs');
const path = require('path');
const { title } = require('process');
var AWS = require('aws-sdk');


let ref_4_service_api = "https://emdnx5w672.execute-api.us-west-2.amazonaws.com/prod/search"
function getRef(service_name) {
    // Return the Reference for the service

    return axios.post(ref_4_service_api, 
      {"QueryText": "amazon-simple-storage-service",
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
}

getRef()