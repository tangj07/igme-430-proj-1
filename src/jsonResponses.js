const fs = require('fs');
const path = require('path');
const url = require('url'); 

const pokedexPath = path.join(__dirname, '..', 'data', 'pokedex.json');

// Pokedex data
const getPokedex = (request, response) => {
  fs.readFile(pokedexPath, 'utf8', (readErr, data) => {
    if (readErr) {
      response.writeHead(500, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({
        error: 'Could not read Pokedex data',
      }));
      return;
    }

    response.writeHead(200, { 'Content-Type': 'application/json' });
    response.end(data);
  });
};

const getPokedexMeta = (request, response) => {
  response.writeHead(200, { 'Content-Type': 'application/json' });
  response.end(JSON.stringify({
    message: 'Pokedex endpoint',
    method: 'GET',
    path: '/getPokedex',
  }));
};

// return pokemon by name or ID
const getPokemon = (request, response) => {
  const parsedUrl = url.parse(request.url, true); 
  const { name, num } = parsedUrl.query; 

  fs.readFile(pokedexPath, 'utf8', (readErr, data) => {
    if (readErr) {
      response.writeHead(500, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({
        error: 'Could not read Pokedex data',
      }));
      return;
    }

    const pokedex = JSON.parse(data); 
    let result = null; 

    if (name) {
      result = pokedex.find((pokemon) => pokemon.name.toLowerCase() === name.toLowerCase());
    }

    // no result found num is provided
    if (!result && num) {
      const idNum = parseInt(num, 10); 
      result = pokedex.find((pokemon) => pokemon.id === idNum); 
    }

    if (result) {
      response.writeHead(200, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify(result));
    } else {
      response.writeHead(404, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({
        error: 'Pokémon not found',
      }));
    }
  });
};

// by type
const getPokemonByType = (request, response) => {
  const parsedUrl = url.parse(request.url, true);
  const { type } = parsedUrl.query; 

  fs.readFile(pokedexPath, 'utf8', (readErr, data) => {
    if (readErr) {
      response.writeHead(500, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({
        error: 'Could not read Pokedex data',
      }));
      return;
    }

    const pokedex = JSON.parse(data); 
    const results = pokedex.filter((pokemon) => {
      const types = pokemon.type.map((t) => t.toLowerCase());
      return types.includes(type.toLowerCase());
    });

    if (results.length > 0) {
      response.writeHead(200, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify(results));
    } else {
      response.writeHead(404, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({
        error: 'No Pokémon found with that type.',
      }));
    }
  });
};

//return the next evolutions 
const getNextEvolutions = (request, response) => {
  const parsedUrl = url.parse(request.url, true);
  const { name, num } = parsedUrl.query;

  fs.readFile(pokedexPath, 'utf8', (readErr, data) => {
    if (readErr) {
      response.writeHead(500, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({ error: 'Could not read Pokedex data' }));
      return;
    }

    const pokedex = JSON.parse(data);

    let result = null;

    if (name) {
      result = pokedex.find((pokemon) => pokemon.name.toLowerCase() === name.toLowerCase());
      console.log(`Searching by name: ${name}, Found: ${result ? result.name : 'Not found'}`);
    }

    //no result found num is provided
    if (!result && num) {
      const idNum = parseInt(num, 10);
      result = pokedex.find((pokemon) => pokemon.id === idNum);
      console.log(`Searching by ID: ${num}, Found: ${result ? result.name : 'Not found'}`);
    }

    if (result) {
      const evolutions = result.next_evolution || [];
      response.writeHead(200, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify(evolutions));
    } else {
      console.log(`Pokémon not found: Name - ${name}, ID - ${num}`);
      response.writeHead(404, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({ error: 'Pokémon not found' }));
    }
  });
};

//add a new Pokémon to the Pokedex
const addPokemon = (request, response, bodyParams) => {
  fs.readFile(pokedexPath, 'utf8', (readErr, data) => {
    if (readErr) {
      response.writeHead(500, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({
        error: 'Could not read Pokedex data',
      }));
      return;
    }

    let pokedex;
    if (data.trim() === '') {
      pokedex = [];
    } else {
      try {
        pokedex = JSON.parse(data);
      } catch (parseErr) {
        response.writeHead(500, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({
          error: 'Could not parse Pokedex data',
        }));
        return;
      }
    }

    const lastPokemon = pokedex[pokedex.length - 1];
    const newId = lastPokemon ? lastPokemon.id + 1 : 1;

    const newPokemon = {
      id: newId,
      name: bodyParams.name || "Unnamed", 
      type: Array.isArray(bodyParams.type) ? bodyParams.type : (typeof bodyParams.type === 'string' ? bodyParams.type.split(',').map(t => t.trim()) : []),
      height: bodyParams.height ? parseFloat(bodyParams.height) : null,
      weight: bodyParams.weight ? parseFloat(bodyParams.weight) : null,
      weaknesses: Array.isArray(bodyParams.weaknesses) ? bodyParams.weaknesses : (typeof bodyParams.weaknesses === 'string' ? bodyParams.weaknesses.split(',').map(w => w.trim()) : []),
      next_evolution: bodyParams.next_evolution ? bodyParams.next_evolution.split(',').map(e => e.trim()) : [],
    };

    const height = newPokemon.height;
    const weight = newPokemon.weight;

    if (height < 0 || weight < 0) {
      response.writeHead(400, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({
        error: 'Height and weight must be non-negative values.',
      }));
      return;
    }

    pokedex.push(newPokemon);

    fs.writeFile(pokedexPath, JSON.stringify(pokedex, null, 2), (writeErr) => {
      if (writeErr) {
        response.writeHead(500, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({
          error: 'Could not save new Pokémon.',
        }));
        return;
      }

      response.writeHead(201, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify(newPokemon));
    });
  });
};

//handle not found 
const notFound = (request, response) => {
  response.writeHead(404, { 'Content-Type': 'application/json' });
  response.end(JSON.stringify({
    error: 'Not Found',
  }));
};

//export all functions
module.exports = {
  getPokedex,
  getPokedexMeta,
  getPokemon,
  getPokemonByType,
  getNextEvolutions,
  addPokemon,
  notFound,
};
