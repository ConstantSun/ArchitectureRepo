var AWS = require("aws-sdk");
var axios = require('axios');

const SERVICE_API = "https://emdnx5w672.execute-api.us-west-2.amazonaws.com/prod/search"

exports.handler = async (event) => {

    // console.log("Event: ", event)

    var body_json = event["body"]
    var body = JSON.parse(body_json)

    var base64_binary = ""

    if (body.url) {

        console.log("URL: ", body.url)

        var url = body.url
        var base64_res = await new Promise((resolve, reject) => {
            axios.get(url, {
                responseType: 'arraybuffer'
            }).then((response => {
                resolve(Buffer.from(response.data, 'binary').toString('base64'))
            }))
        })
        base64_binary = new Buffer.from(base64_res, 'base64')
    }
    else if (body.byte) {
        var base64_cleaned = body.byte.split("base64,")[1]
        base64_binary = new Buffer.from(base64_cleaned, 'base64')
    }

    var rekognition = new AWS.Rekognition();
    var rekognition_cross = await getCrossAccClient();

    var model_arn_service_1 = "arn:aws:rekognition:ap-southeast-1:149138027713:project/capstone-service-detection-services-1/version/capstone-service-detection-services-1.2022-08-01T17.00.30/1659344430169"
    var model_arn_service_2 = "arn:aws:rekognition:ap-southeast-1:149138027713:project/capstone-service-detection-services-2/version/capstone-service-detection-services-2.2022-08-01T17.02.24/1659344544515"
    var model_arn_service_3 = "arn:aws:rekognition:ap-southeast-1:149138027713:project/capstone-service-detection-services-3/version/capstone-service-detection-services-3.2022-08-01T17.02.49/1659344569340"
    var model_arn_service_4 = "arn:aws:rekognition:ap-southeast-1:974960484508:project/capstone-service-supplement/version/capstone-service-supplement.2022-08-02T08.35.49/1659400549946"
    var model_arn_resource_1 = "arn:aws:rekognition:ap-southeast-1:974960484508:project/capstone-resource-detection-1/version/capstone-resource-detection-1.2022-07-29T12.49.11/1659070151574"
    var model_arn_resource_2 = "arn:aws:rekognition:ap-southeast-1:974960484508:project/capstone-resource-detection-2/version/capstone-resource-detection-2.2022-07-29T12.50.09/1659070209434"

    var [
        label1,
        label2,
        label3,
        label4,
        label5,
        label6,
        text6
    ] = await Promise.all([
        detectLabels(rekognition, base64_binary, model_arn_service_1),
        detectLabels(rekognition, base64_binary, model_arn_service_2),
        detectLabels(rekognition, base64_binary, model_arn_service_3),
        detectLabels(rekognition_cross, base64_binary, model_arn_service_4),
        detectLabels(rekognition_cross, base64_binary, model_arn_resource_1),
        detectLabels(rekognition_cross, base64_binary, model_arn_resource_2),
        detectText(rekognition, base64_binary)
    ])

    var labels = label1.CustomLabels.concat(
        label2.CustomLabels, 
        label3.CustomLabels, 
        label4.CustomLabels, 
        label5.CustomLabels, 
        label6.CustomLabels
        )

    var texts = text6.TextDetections.map(text => {
        return {
            DetectedText: text.DetectedText,
            ParentId: text.ParentId
        }
    })

    var filteredLabels = []

    labels.map((label) => {
        var left = label.Geometry.BoundingBox.Left;
        var top = label.Geometry.BoundingBox.Top;
        var width = label.Geometry.BoundingBox.Width;
        var height = label.Geometry.BoundingBox.Height;
        var pass = false;
        var i = filteredLabels.length;
        while (i > 0 && i--) {
            var item = filteredLabels[i];
            if (
                Math.abs(left - item.Geometry.BoundingBox.Left) <
                Math.max(width, item.Geometry.BoundingBox.Width) &&
                Math.abs(top - item.Geometry.BoundingBox.Top) <
                Math.max(height, item.Geometry.BoundingBox.Height)
            ) {
                if (item.Confidence > label.Confidence) {
                    pass = true;
                }
                else {
                    filteredLabels.splice(i, 1);
                    break;
                }
            }
        }
        if (!pass) {
            filteredLabels.push({ ...label });
        }
    })

    // sort filteredLabels based on confidence
    filteredLabels = sortByConfidence(filteredLabels)
    // console.log("Sorted: ", filteredLabels)

    var services = filteredLabels.map(label => {
        return label.Name
    })

    texts.map(text => {
        var detected_text = text.DetectedText.toLowerCase()
        if (detected_text) {
            if (detected_text.includes("aws") || detected_text.toLowerCase().includes("amazon")) {
                detected_text = detected_text.replace("aws", "")
                detected_text = detected_text.replace("amazon", "")
                if (detected_text.trim() != "") {
                    services.push(text.DetectedText.replaceAll(" ", "-"))
                }
            }
        }
    })

    // console.log("Services: ", services)

    var uSet = new Set(services)
    services = [...uSet]
    // console.log("Number of services queried: ", services.length)
    // console.log("Services queried: ", services)
    // services = services.splice(0, 10)

    var _ref_links = []
    for (var i = 0; i < services.length; i += 5) {
        var result = await Promise.all(services.slice(i, i + 5).map(service => {
            return getRef(service)
        }))
        _ref_links.push(...result)
    }

    // console.log("Number of reference links: ", _ref_links.length)
    // console.log("Reference links: ", _ref_links)
    
    // remove null
    _ref_links = _ref_links.filter(element => {
        return element !== null;
    });

    var mapLinkToService = []

    _ref_links.map((item) => {
        mapLinkToService[item.Link] = mapLinkToService[item.Link] ? mapLinkToService[item.Link] + ", " + item.Service : item.Service
    })

    var ref_links = []
    for (var key in mapLinkToService) {
        ref_links.push({
            Service: mapLinkToService[key],
            Link: key
        })
    }

    // console.log("Ref Links: ", ref_links)

    var response_body = {
        "labels": filteredLabels,
        "text": texts,
        "ref_links": ref_links
    }

    // console.log("Response: ", response_body)

    const response = {
        statusCode: 200,
        headers: {
            "Access-Control-Allow-Origin": "*", // Required for CORS support to work
        },
        body: JSON.stringify(response_body),
    };
    return response;
};

const detectLabels = async (rekognition, base64, model_arn) => {
    return new Promise((resolve, reject) => {
        rekognition.detectCustomLabels({
            Image: { 'Bytes': base64 },
            ProjectVersionArn: model_arn,
            MinConfidence: 15
        }, function(err, data) {
            if (err) reject(err); // an error occurred
            else resolve(data); // successful response
        })
    })
}

const detectText = async (rekognition, base64) => {
    return new Promise((resolve, reject) => {
        rekognition.detectText({
            Image: { 'Bytes': base64 }
        }, function(err, data) {
            if (err) reject(err); // an error occurred
            else resolve(data); // successful response
        })
    })
}

const getRef = async (servicename) => {
    return new Promise((resolve, reject) => {
        // console.log("Service Name: ", servicename)

        var _servicename = servicename.toLowerCase()
        _servicename = _servicename.replace("aws", "")
        _servicename = _servicename.replace("amazon", "")

        axios.post(SERVICE_API, {
            "QueryText": _servicename,
            "PageNumber": 1,
            "PageSize": 10,
            "Locale": "en_us",
            "Previous": ""
        }).then(response => {
            if (response.data.ResultItems[0]) {
                resolve({ Service: servicename, Link: response.data.ResultItems[0]["DocumentURI"] })
            }
            else {
                resolve(null)
            }
        })
    })
}

const sortByConfidence = (list) => {
    return list.sort((a, b) => b.Confidence - a.Confidence);
}

const getCrossAccClient = async () => {
    var sts = new AWS.STS({ region: process.env.REGION });
    var stsParams = {
        RoleArn: "arn:aws:iam::974960484507:role/Rekognition-Cross-Account",
        DurationSeconds: 900,
        RoleSessionName: "cross-account-rekognition"
    };
    const stsResults = await sts.assumeRole(stsParams).promise();
    // console.log(stsResults);

    return new AWS.Rekognition({
        region: process.env.REGION,
        accessKeyId: stsResults.Credentials.AccessKeyId,
        secretAccessKey: stsResults.Credentials.SecretAccessKey,
        sessionToken: stsResults.Credentials.SessionToken
    })
}
