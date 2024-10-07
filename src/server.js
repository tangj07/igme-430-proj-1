const http = require('http');
const url = require('url');
const query = require('querystring');
const htmlHandler = require('./htmlResponses.js');
const jsonHandler = require('./jsonResponses.js');

const port = process.env.PORT || process.env.NODE_PORT || 3000;

const parseBody = (request, response, handler) => {
  const body = [];
  
  request.on('error', (err) => {
    console.dir(err);
    response.statusCode = 400;
    response.end();
  });

  request.on('data', (chunk) => {
    body.push(chunk);
  });

  request.on('end', () => {
    const bodyString = Buffer.concat(body).toString();
    let bodyParams;
    try {
      bodyParams = JSON.parse(bodyString);
    } catch (err) {
      bodyParams = query.parse(bodyString);
    }
    handler(request, response, bodyParams);
  });
};


const urlStruct = {
  GET: {
    '/': htmlHandler.getIndex,
    '/style.css': htmlHandler.getCSS,
    '/getPokedex': jsonHandler.getPokedex,
    '/getPokemon': jsonHandler.getPokemon,
    '/getPokemonByType': jsonHandler.getPokemonByType,
    '/getNextEvolutions': jsonHandler.getNextEvolutions,
    '/addPokemon': jsonHandler.addPokemon,
    notFound: jsonHandler.notFound,
  },
  HEAD: {
    '/getPokedex': jsonHandler.getPokedexMeta,
    notFound: jsonHandler.notFound,
  },
};

// handle POST
const handlePost = (request, response, parsedUrl) => {
  if (parsedUrl.pathname === '/addPokemon') {
    parseBody(request, response, jsonHandler.addPokemon);
  }
};

// handle GET requests
const handleGet = (request, response, parsedUrl) => {
  if (!urlStruct[request.method]) {
    return urlStruct.HEAD.notFound(request, response);
  }
  if (urlStruct[request.method][parsedUrl.pathname]) {
    return urlStruct[request.method][parsedUrl.pathname](request, response);
  }
  return urlStruct[request.method].notFound(request, response);
};

// handle requests
const onRequest = (request, response) => {
  const parsedUrl = url.parse(request.url);
  if (request.method === 'POST') {
    handlePost(request, response, parsedUrl);
  } else {
    handleGet(request, response, parsedUrl);
  }
};

http.createServer(onRequest).listen(port, () => {
  console.log(`Listening on 127.0.0.1: ${port}`);
});
