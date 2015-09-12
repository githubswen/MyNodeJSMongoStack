var mclient = require('mongodb');
var http = require('http');
assert = require('assert');
var port = process.argv[2];
var url = 'mongodb://localhost:27017/mydb';
var emailAddress= "abc@def.com";
var longitude = 121.00;
var latitude = 48.00;
var data = "";
var cursor = '';

var insertDocuments = function(db, callback) {
    var collection = db.collection('myCol');

    collection.insert({email:emailAddress, loc:{lon:longitude, lat:latitude}}, function(err, result) {
    assert.equal(err, null);
    console.log("Inserted a doc into myCol collection");
    callback(result);
    });
}

var findDocuments = function(db, callback) {
    var collection = db.collection('myCol');

    collection.find({loc:{$near:[longitude, latitude]}},{_id:0}).limit(4).toArray(function(err, docs) {
        assert.equal(err, null);
        console.log("Found the following records");
        //console.dir(docs);
        callback(docs);
    });
}

var removeDocuments = function(db, callback) {
    var collection = db.collection('myCol');

    collection.remove({email: emailAddress}, function(err, result) {
    assert.equal(err, null);
    console.log("Removed a doc from myCol collection");
    callback(result);
    });
}

var server = http.createServer(function(request, response) {
    var fullBody = '';
    console.log("Received REQUEST");
    if (request.method == 'POST') {

        request.on('data', function(chunk) {
            fullBody += chunk.toString();
        });

        request.on('end', function() {
            console.log(fullBody);
            var data = JSON.parse(fullBody);
            console.log(data.email);
            emailAddress = data.email;
            var loc = JSON.parse(data.loc);
            console.log(loc.lon);
            longitude = loc.lon;
            console.log(loc.lat);
            latitude = loc.lat;
            mclient.connect(url, function(err, db) {
                assert.equal(null, err);
                console.log("Connected correctly to server");
                findDocuments(db, function(results) { 
                    cursor = results;
                    insertDocuments(db, function() {
                            db.close();
                    });
                });
            });
            response.writeHead(200, "OK", {'Content-Type': 'text/plain'});
            var buffer = new Buffer(JSON.stringify(cursor), "utf-8");
            response.write(buffer);
            response.end();
        });
    }
    else if (request.method == 'DELETE') {
        console.log("Received DELETE");
        console.log((request.url).replace(/^\//g,""));
        emailAddress = (request.url).replace(/^\//g,"");
        mclient.connect(url, function(err, db) {
            assert.equal(null, err);
            console.log("Connected correctly to server");
            removeDocuments(db, function(results) { 
            });
        });
        response.writeHead(200, "OK", {'Content-Type': 'text/plain'});
        response.end();
    }
    else {
        return response.end('Please send a POST message\n');
    }
});
server.listen(port);
