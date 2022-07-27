const shared_funcs = require('./shared_funcs')

// shared_funcs.put2Dynamo("abx12", "123date34", "archURl56", "crawler data", {"labels": "123", "textServices": "abc", "textMetadata": "kml"}, "ref link")

shared_funcs.getURLs("https://aws.amazon.com/api/dirs/items/search?item.directoryId=blog-posts&sort_by=item.additionalFields.createdDate&sort_order=desc&size=250&item.locale=en_US&page=1")