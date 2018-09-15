var http = require('http');
var url = require('url');
var Peapod = require('peapod-v3');
var secrets = require('./secrets.json');
var peapod = new Peapod(secrets);

var server = http.createServer(function(req, resp) {
    resp.writeHead(200, {'Content-Type': 'text/html'});

    var page = url.parse(req.url).pathname;
    var split = page.split('/');
    
    switch (split[1]){
	    case 'search':
            var item = decodeURIComponent(split[2]);
            peapod.search(item, function (err, results) {
                resp.writeHead(200, {'Content-Type': 'text/plain'});
                resp.write(JSON.stringify(results));
                resp.end();
            });
            break;
	    case 'add':
            // bananas: 197476
            var productId = parseInt(split[2]);
            var quantity = parseInt(split[3]);
            peapod.addToCart(productId, quantity, function(err, didSucceed) {
                resp.writeHead(200, {'Content-Type': 'text/plain'});
                resp.write(JSON.stringify(didSucceed));
                resp.end();
            });
            break;
	    case 'remove':
            // probably use add to overwrite if removing < n items
            var productId = parseInt(split[2]);
            peapod.removeFromCart(productId, function (err, didSucceed) {
                resp.writeHead(200, {'Content-Type': 'text/plain'});
                resp.write(JSON.stringify(didSucceed));
                resp.end();
            });
            break;
        case 'view':
            peapod.viewCart(function (err, results) {
                resp.writeHead(200, {'Content-Type': 'text/plain'});
                resp.write(JSON.stringify(results));
                resp.end();
            });
            break;
        default:
            resp.writeHead(200, {'Content-Type': 'text/plain'});
            resp.write('sad');
            resp.end();
    }
});

var port = 8080;
server.listen(port);
console.log('Listening on %d', port);
