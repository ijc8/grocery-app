var http = require('http');
var Peapod = require('peapod');
var secrets = require('./secrets.json');
var peapod = new Peapod(secrets);

var server = http.createServer(function(req, resp) {
    resp.writeHead(200, {'Content-Type': 'text/html'});
    peapod.search('cheese', function (err, results) {
        resp.writeHead(200, {'Content-Type': 'text/plain'});
        resp.write(JSON.stringify(results));
        resp.end();
    });
});

var port = 8080;
server.listen(port);
console.log('Listening on %d', port);
