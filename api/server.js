var express = require('express');
var bodyParser = require('body-parser');
var multiparty = require('connect-multiparty');
var mongodb = require('mongodb');
var ObjectID = require('mongodb').ObjectID;
var fs = require('fs');


var app = express();

app.use(bodyParser.urlencoded({ extended: true }));
app.use(bodyParser.json());
app.use(multiparty());

//pra tratar o Preflight Request e Permissao de acesso
// a API
app.use(function (req, res, next) {

    res.setHeader('Access-Control-Allow-Origin', '*');
    res.setHeader('Access-Control-Allow-Methods', 'GET, POST, PUT, DELETE');
    res.setHeader('Access-Control-Allow-Headers', 'content-type');
    res.setHeader('Access-Control-Allow-Credentials', true);
    next();
});

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
    //res.setHeader('Access-Control-Allow-Origin','http://localhost/80');
    //res.setHeader('Access-Control-Allow-Origin', '*');

    var date = new Date();
    var time_stamp = date.getTime();
    var url_imagem = time_stamp + '_' + req.files.arquivo.originalFilename;

    var path_origem = req.files.arquivo.path;
    var path_destino = './uploads/' + url_imagem;


    fs.rename(path_origem, path_destino, function (err) {
        if (err) {
            res.status(500).json({ error: err });
            return;
        }

        var dados = {
            url_imagem: url_imagem,
            titulo: req.body.titulo
        }
        db.open(function (err, mongloClient) {
            mongloClient.collection('postagens', function (err, collection) {
                collection.insert(dados, function (err, result) {
                    if (err) {
                        res.json({ 'status': 'erro' });
                    } else {
                        res.json({ 'status': 'Inclusao realizada com sucesso' });
                    }
                });
            });
            mongloClient.close();
        });

    });



});

app.get('/api', function (req, res) {
    //res.setHeader('Access-Control-Allow-Origin', '*');

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
    //res.setHeader('Access-Control-Allow-Origin', '*');

    db.open(function (err, mongloClient) {
        mongloClient.collection('postagens', function (err, collection) {

            if (collection == undefined) {
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

app.get('/imagens/:imagem', function (req, res) {
    var img = req.params.imagem;
    fs.readFile('./uploads/' + img, function (err, content) {
        if (err) {
            res.status(400).json({ err });
            return;
        }

        res.writeHead(200, { 'content-type': 'image/jpg' });
        res.end(content);

    });
});

app.put('/api/:id', function (req, res) {
    db.open(function (err, mongloClient) {
        mongloClient.collection('postagens', function (err, collection) {
            //collection.find(ObjectID(req.params.id)).toArray(function (err, result) {
            collection.update(
                { _id: ObjectID(req.params.id) },
                {
                    $push:
                    {
                        comentarios: {
                            id_comentario: new ObjectID(),
                            comentario: req.body.comentario
                        }
                    }
                },
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

    //res.send(req.params.id);


    db.open(function (err, mongloClient) {
        mongloClient.collection('postagens', function (err, collection) {
            //collection.remove(
            collection.update(
                {},
                { $pull: { comentarios: { id_comentario: ObjectID(req.params.id) } } },
                { multi: true },
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