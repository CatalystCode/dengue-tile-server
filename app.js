var restify = require('restify');
var azure = require('azure-storage');
var blobService = azure.createBlobService();

var tile = require('./tile.js');

var server = restify.createServer({
  name: 'tile-server',
  version: '1.0.0'
});

server.use(restify.acceptParser(server.acceptable));
server.use(restify.queryParser());

server.get('/tiles/', function (req, res, next) {
  tileIds = tile.tileIdsForBoundingBox({
    north: parseFloat(req.query.north),
    west: parseFloat(req.query.west),
    south: parseFloat(req.query.south),
    east: parseFloat(req.query.east)
  }, parseInt(req.query.zoom));

  aggregateResults = {};
  var promiseCollection = [];
  tileIds.forEach(function (tile) {
    tileSplit = tile.split('_');
    path = '2015/06/06/' + tileSplit[0] + '/' + tileSplit[2] + '/' + tileSplit[1] + '/twitter.json';
    promiseCollection.push(new Promise(function (resolve, reject) {
      blobService.getBlobToText('layers', path, function (error, result, response) {
        if (!error) {
          aggregateResults[tile] = JSON.parse(result);
          resolve(JSON.parse(result));
        } else {
          console.warn(error.statusCode);
          resolve(null);
        }
      });
    }));
  });
  Promise.all(promiseCollection).then(function (results) {
    res.send(JSON.stringify(aggregateResults));
    next();
  });
});


server.listen(process.env.PORT || 3978, function () {
  console.log('%s listening to %s', server.name, server.url);
});

