const fs = require('fs');

const index = fs.readFileSync(`${__dirname}/../client/client.html`);
const doc = fs.readFileSync(`${__dirname}/../client/documentation.html`);
const css = fs.readFileSync(`${__dirname}/../client/style.css`);

// index page
const getIndex = (request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/html' });
  response.write(index);
  response.end();
};

//doc page
const getDoc = (request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/html' });
  response.write(doc);
  response.end();
};

// css page
const getCSS = (request, response) => {
  response.writeHead(200, { 'Content-Type': 'text/css' });
  response.write(css);
  response.end();
};

module.exports = {
  getIndex,
  getDoc,   
  getCSS,
};
