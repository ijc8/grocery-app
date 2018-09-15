const url = require('url');
const Peapod = require('peapod-v3');
const secrets = require('./secrets.json');
const peapod = new Peapod(secrets);
const express = require('express');
const app = express();

var users = [
    {
        username: "ijc",
        balance: 5.00,
        cart: {
            unsubmitted: [
                {
                    id: 197476,
                    qty: 1,
                }
            ],
            submitted: [
                {
                    id: 197476,
                    qty: 4500,
                }
            ],
            paid: [
                {
                    id: 197476,
                    qty: 4500,
                }
            ]
        },
        past_orders: [
            {
                timestamp: 0,
                cart: [
                    {
                        id: 197476,
                        qty: 1999,
                    }
                ],
                total: 3000000000,
            }
        ]
    }
]

app.get('/', (req, res) => res.send('sad'));

app.get('/search/:query', (req, res) => {
    peapod.search(req.params.query, (err, results) => {
        res.send(JSON.stringify(results));
    });
});

app.get('/add/:id/:qty', (req, res) => {
    var pid = parseInt(req.params.id);
    var qty = parseInt(req.params.qty);
    peapod.addToCart(pid, qty, (err, didSucceed) => {
        res.send(JSON.stringify(didSucceed));
    });
});

app.get('/remove/:id', (req, res) => {
    var pid = parseInt(req.params.id);
    peapod.removeFromCart(pid, qty, (err, didSucceed) => {
        res.send(JSON.stringify(didSucceed));
    });
});

app.get('/view', (req, res) => {
    peapod.viewCart(function (err, results) {
        res.send(JSON.stringify(results));
    });
});

var port = 8080;
app.listen(port, () => console.log('Listening on %d', port));
