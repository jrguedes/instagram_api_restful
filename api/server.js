var express = require('express');
var bodyParser = require('body-parser');
var mongodb = require('mongodb');
var ObjectID = require('mongodb').ObjectID;

var app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());

var port = 8080;

app.listen(port);

var db = new mongodb.Db(
    'db_instagram',
    new mongodb.Server('localhost', 27017, {}),
    {}
);

console.log('Servidor HTTP está escutando a porta ' + port);

app.get('/', function (req, res) {
    res.send({ msg: 'Olá' });
});

app.post('/api', function (req, res) {
    var dados = req.body;

    db.open(function (err, mongloClient) {
        mongloClient.collection('postagens', function (err, collection) {
            collection.insert(dados, function (err, result) {
                if (err) {
                    res.json({ 'status': '0' });
                } else {
                    res.json(result);
                }
            });
        });
        mongloClient.close();
    });
});

app.get('/api', function (req, res) {
    db.open(function (err, mongloClient) {
        mongloClient.collection('postagens', function (err, collection) {
            collection.find().toArray(function (err, result) {
                if (err) {
                    res.json(err);
                } else {
                    res.json(result);
                }
            });
        });
        mongloClient.close();
    });
});

app.get('/api/:id', function (req, res) {
    db.open(function (err, mongloClient) {
        mongloClient.collection('postagens', function (err, collection) {

            if (collection == undefined){
                res.status(404).json([]);
                return;
            }
            //collection.find(ObjectID(req.params.id)).toArray(function (err, result) {            
            collection.find({ _id: ObjectID(req.params.id) }).toArray(function (err, result) {
                if (err) {
                    res.status(500).json(err);
                } else {
                    res.status(200).json(result);
                }                
            });
            
        });
        mongloClient.close();
    });
});

app.put('/api/:id', function (req, res) {
    db.open(function (err, mongloClient) {
        mongloClient.collection('postagens', function (err, collection) {
            //collection.find(ObjectID(req.params.id)).toArray(function (err, result) {
            collection.update(
                { _id: ObjectID(req.params.id) },
                { $set: { titulo: req.body.titulo } },
                { multi: false },
                function (err, result) {
                    if (err) {
                        res.json(err);
                    } else {
                        res.json(result);
                    }
                }
            );
        });
        mongloClient.close();
    });
});

app.delete('/api/:id', function (req, res) {
    db.open(function (err, mongloClient) {
        mongloClient.collection('postagens', function (err, collection) {
            collection.remove(
                { _id: ObjectID(req.params.id) },
                function (err, result) {
                    if (err) {
                        res.json(err);
                    } else {
                        res.json(result);
                    }
                });
        });
        mongloClient.close();
    });
});