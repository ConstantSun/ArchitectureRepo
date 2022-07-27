// Load the AWS SDK for Node.js
var AWS = require('aws-sdk');
// Set the region 
AWS.config.update({region: 'ap-southeast-1'});

// Create the DynamoDB service object
var ddb = new AWS.DynamoDB({apiVersion: '2012-08-10'});

var params = {
    TableName: 'AllieDiagrams',
    Key: {
        'OriginURL': {S: 'test'},
        'PublishDate': {S: 'test'}

    }
    // ProjectionExpression: 'ATTRIBUTE_NAME'
  };
  
  // Call DynamoDB to read the item from the table
  ddb.getItem(params, function(err, data) {
    if (err) {
      console.log("Error", err);
    } else {
      console.log("Success", data.Item);
    }
  });

