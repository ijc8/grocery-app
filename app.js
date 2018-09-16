const url = require('url');
const Peapod = require('./peapod.js');
const secrets = require('./secrets.json');
const peapod = new Peapod(secrets);
const express = require('express');
const app = express();

var notifications = [ "shrekt", "order stuff" ];

var users = {
    "ijc": {
        balance: 5.00,
        cart: {
            unsubmitted: {
                197476: {
                    name: "banana",
                    price: 2.00,
                    qty: 1,
                },
            },
            submitted: {
                197476: {
                    name: "banana",
                    price: 2.00,
                    qty: 3,
                },
            },
            paid: {
                197476: {
                    name: "banana",
                    price: 2.00,
                    qty: 7,
                },
                186822: {
                    name: "cheese",
                    price: 5.00,
                    qty: 2,
                },
            }
        },
        past_orders: [
            {
                timestamp: 0,
                cart: {
                    197476: {
                        name: "old banana",
                        price: 1.00,
                        qty: 1999,
                    },
                },
            }
        ]
    }
}

app.get('/', (req, res) => res.send('sad'));

app.get('/user', (req, res) => res.sendFile('./user_index.html', { root: __dirname }));

app.get('/user/cart', (req, res) => {
    let cart = users[req.query.username].cart;
    let id = parseInt(req.query.id);
    res.send(JSON.stringify(cart));
});

app.put('/user/cart', (req, res) => {
    let cart = users[req.query.username].cart.unsubmitted;
    let id = parseInt(req.query.id);
    let name = req.query.name;
    let price = parseFloat(req.query.price);
    cart[id] = { qty:parseInt(req.query.qty),
                 name:name,
                 price:price
               };
    res.send(JSON.stringify(cart));
});

app.delete('/user/cart', (req, res) => {
    // TODO handle submitted/paid stuff
    let cart = users[req.query.username].cart.unsubmitted;
    let id = parseInt(req.query.id);
    delete cart[id];
    res.send(JSON.stringify(cart));
});

function calculateTotal(products) {
    var total = 0;
    Object.keys(products).forEach((item) => {
        total += products[item].price * products[item].qty;
    });
    return total;
}

function updateProducts(products, callback) {
    peapod.detail(Object.keys(products), (err, data) => {
        data.products.forEach((item) => {
            products[item.prodId].name = item.name;
            products[item.prodId].price = item.price;
        });
        callback();
    });
}

app.post('/user/submit', (req, res) => {
    let unsubmitted = users[req.query.username].cart.unsubmitted;
    let submitted = users[req.query.username].cart.submitted;
    let oldTotal = calculateTotal(unsubmitted);
    updateProducts(unsubmitted, () => {
        let newTotal = calculateTotal(unsubmitted);
        if (oldTotal !== newTotal) {
            res.send('AHH YOUR PRICES CHANGED (diff = ' + (newTotal - oldTotal) + ')');
        } else {
            for (var key in unsubmitted) {
                if (key in submitted) {
                    submitted[key].qty += unsubmitted[key].qty;
                } else {
                    submitted[key] = unsubmitted[key];
                }
            }
            users[req.query.username].cart.unsubmitted = {};
            notifications.push(req.query.username + " owes something (lol)");
            res.send(JSON.stringify(submitted));
        }
    });
});

app.post('/user/demand', (req, res) => {
    notifications.push(req.query.username + " demands $" + users[req.query.username].balance);
    res.send('ye');
});

app.get('/user/balance', (req, res) => {
    res.send(JSON.stringify(users[req.query.username].balance));
});

app.post('/user/balance', (req, res) => {
    res.send('I hope you are the admin lol<br />');
    res.send(JSON.stringify(users[req.query.username].balance));
});

app.get('/admin/notifications', (req, res) => {
    res.send(JSON.stringify(notifications));
});

app.delete('/admin/notifications', (req, res) => {
    let id = parseInt(req.query.id);
    notifications.splice(id, 1);
    res.send(JSON.stringify(notifications));
});

app.post('/admin/finalize', (req, res) => {
    var cart = {};
    for (var user in users) {
        let paid = users[user].cart.paid;
        let oldTotal = calculateTotal(paid);
        updateProducts(paid, () =>  {
            let newTotal = calculateTotal(paid);
            if (oldTotal != newTotal) {
                users[user].balance += oldTotal - newTotal;
                console.log(`${user}'s balance changed by ${oldTotal - newTotal}`);
            }

            for (var item in users[user].cart.paid) {
                if (!(item in cart)) {
                    cart[item] = 0;
                }
                cart[item] += users[user].cart.paid[item].qty;
            }
            users[user].past_orders.push({ timestamp: 3,
                                           cart: users[user].cart.paid,
                                           total: -7 });
            users[user].cart.paid = {};

            var s = "";
            var i = 0;
            Object.keys(cart).forEach((item) => {
                peapod.addToCart(item, cart[item], (err, succeed) => {
                    i += 1;
                    console.log(item);
                    console.log(err);
                    console.log(succeed);
                    s += "Added " + item + " (" + cart[item] + ")\n";
                    if (i === Object.keys(cart).length) {
                        res.send(s);
                    }
                });
            });
        });
    }
});

app.post('/admin/confirm', (req, res) => {
    let submitted = users[req.query.username].cart.submitted;
    let paid = users[req.query.username].cart.paid;
    for (var key in submitted) {
        if (key in paid) {
            paid[key].qty += submitted[key].qty;
        } else{
            paid[key] = submitted[key];
        }
    }
    users[req.query.username].cart.submitted = {};
    res.send(JSON.stringify(paid));
});

// Who cares if you are logged in
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
