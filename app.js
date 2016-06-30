const restify = require('restify');
const azure = require('azure-storage');
const tile = require('./tile.js');

const blobService = azure.createBlobService();

const server = restify.createServer({
  name: 'tile-server',
  version: '1.0.0'
});

server.use(restify.acceptParser(server.acceptable));
server.use(restify.queryParser());
server.use(restify.CORS());

server.get('/tiles/', function (req, res, next) {
  tileIds = tile.tileIdsForBoundingBox({
    north: parseFloat(req.query.north),
    west: parseFloat(req.query.west),
    south: parseFloat(req.query.south),
    east: parseFloat(req.query.east)
  }, parseInt(req.query.zoom));

  let aggregateResults = {};
  let promiseCollection = [];

  tileIds.forEach((tile) => {
    const tileSplit = tile.split('_');
    const path = `2015/06/06/${tileSplit[0]}/${tileSplit[2]}/${tileSplit[1]}/twitter.json`;

    promiseCollection.push(new Promise((resolve, reject) => {
      blobService.getBlobToText('layers', path, (err, result, response) => {
        if (!err) {
          aggregateResults[tile] = JSON.parse(result);
          resolve(JSON.parse(result));
        } else {
          console.warn(err.statusCode);
          resolve(null);
        }
      });
    }));
  });

  Promise.all(promiseCollection)
    .then(function (results) {
      res.send(JSON.stringify(aggregateResults));
      next();
    });
});


server.listen(process.env.PORT || 3978, function () {
  console.log('%s listening to %s', server.name, server.url);
});

