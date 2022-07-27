const axios = require('axios');

function getRef(service_name) {
    // Return the Reference for the service
    service_name = service_name.toLowerCase()
    service_name = service_name.replace("aws", "")
    service_name = service_name.replace("amazon", "")
    let ref_4_service_api = "https://emdnx5w672.execute-api.us-west-2.amazonaws.com/prod/search"

    return axios.post(ref_4_service_api, 
      {"QueryText": service_name,
        "PageNumber": 1,
        "PageSize": 10,
        "Locale": "en_us",
        "Previous": ""}
      ).then(function(response) {
        // console.log(response.data)
        tem = []
        let ref_link = response.data.ResultItems[0].DocumentURI
        for (let index = 0; index < 5; index++) {
          tem.push(response.data.ResultItems[index].DocumentURI)
        }
        console.log(tem)
        return ref_link
      }).catch(function(error) {
        console.log(error)
      })
}

var test1 = "aws-directory-service"
var test2 = "aws s3"
var test3 = "aws-iot-analytics"
var test4 = "aws ec2"
var test5 = "amazon dynamodb"

getRef(test5)
