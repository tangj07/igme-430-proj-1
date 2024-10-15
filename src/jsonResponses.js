const fs = require('fs');
const path = require('path');
const url = require('url');

const pokedexPath = path.join(__dirname, '..', 'data', 'pokedex.json');

let pokemonData; // read file once
try {
  pokemonData = JSON.parse(fs.readFileSync(pokedexPath, 'utf8'));
} catch (error) {
  console.error('Error reading Pokedex data at startup:', error);
  pokemonData = [];
}

// Pokedex data
const getPokedex = (request, response) => {
  response.writeHead(200, { 'Content-Type': 'application/json' });
  response.end(JSON.stringify(pokemonData));
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

  let result = null;

  if (name) {
    result = pokemonData.find((pokemon) => pokemon.name.toLowerCase() === name.toLowerCase());
  }

  if (!result && num) {
    const idNum = parseInt(num, 10);
    result = pokemonData.find((pokemon) => pokemon.id === idNum);
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
};

// by type
const getPokemonByType = (request, response) => {
  const parsedUrl = url.parse(request.url, true);
  const { type } = parsedUrl.query;

  const results = pokemonData.filter((pokemon) => {
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
};

// return the next evolutions
const getNextEvolutions = (request, response) => {
  const parsedUrl = url.parse(request.url, true);
  const { name, num } = parsedUrl.query;

  let result = null;

  if (name) {
    result = pokemonData.find((pokemon) => pokemon.name.toLowerCase() === name.toLowerCase());
    console.log(`Searching by name: ${name}, Found: ${result ? result.name : 'Not found'}`);
  }

  if (!result && num) {
    const idNum = parseInt(num, 10);
    result = pokemonData.find((pokemon) => pokemon.id === idNum);
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
};

// add a new Pokémon to the Pokedex
const addPokemon = (request, response, bodyParams) => {
  const lastPokemon = pokemonData[pokemonData.length - 1];
  const newId = lastPokemon ? lastPokemon.id + 1 : 1;

  const newPokemon = {
    id: newId,
    name: bodyParams.name || 'Unnamed',
    type: Array.isArray(bodyParams.type) ? bodyParams.type : [bodyParams.type],
    height: bodyParams.height ? parseFloat(bodyParams.height) : null,
    weight: bodyParams.weight ? parseFloat(bodyParams.weight) : null,
    weaknesses: Array.isArray(bodyParams.weaknesses)
      ? bodyParams.weaknesses
      : [bodyParams.weaknesses],
    next_evolution: bodyParams.next_evolution
      ? bodyParams.next_evolution.split(',').map((e) => e.trim())
      : [],
  };

  pokemonData.push(newPokemon);

  fs.writeFile(pokedexPath, JSON.stringify(pokemonData, null, 2), (writeErr) => {
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
};

//rate pokemon
const ratePokemon = (request, response, bodyParams) => {
  let pokemonToRate = null;
  const { name, num } = bodyParams;

  if (name) {
    const lowerCasedName = name.toLowerCase();
    pokemonToRate = pokemonData.find((pokemon) => pokemon.name.toLowerCase() === lowerCasedName);
  }

  if (!pokemonToRate && num) {
    const idNum = parseInt(num, 10);
    pokemonToRate = pokemonData.find((pokemon) => pokemon.id === idNum);
  }

  if (pokemonToRate) {
    const rating = parseInt(bodyParams.rating, 10);
    if (!pokemonToRate.rating) {
      pokemonToRate.rating = [];
    }
    if (!Number.isNaN(rating) && rating >= 1 && rating <= 10) { //0-10 rating
      pokemonToRate.rating.push(rating);
      fs.writeFile(pokedexPath, JSON.stringify(pokemonData, null, 2), (writeErr) => {
        if (writeErr) {
          response.writeHead(500, { 'Content-Type': 'application/json' });
          response.end(JSON.stringify({ error: 'Could not save the rating.' }));
          return;
        }

        response.writeHead(200, { 'Content-Type': 'application/json' });
        response.end(JSON.stringify({
          message: `Rating added to Pokémon ${pokemonToRate.name}.`,
          pokemon: pokemonToRate,
        }));
      });
    } else {
      response.writeHead(400, { 'Content-Type': 'application/json' });
      response.end(JSON.stringify({ error: 'Rating must be a number between 1 and 10.' }));
    }
  } else {
    response.writeHead(404, { 'Content-Type': 'application/json' });
    response.end(JSON.stringify({ error: 'Pokémon not found' }));
  }
};

// handle not found
const notFound = (request, response) => {
  response.writeHead(404, { 'Content-Type': 'application/json' });
  response.end(JSON.stringify({
    error: 'Not Found',
  }));
};

// export all functions
module.exports = {
  getPokedex,
  getPokedexMeta,
  getPokemon,
  getPokemonByType,
  getNextEvolutions,
  addPokemon,
  ratePokemon,
  notFound,
};
