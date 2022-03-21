const { getItems, getItem } = require("../../controllers/items.js");

function itemRoutes(fastify, options, done) {
  fastify.get("/items", getItems);

  fastify.get("/items/:id", getItem);

  done();
}

module.exports = itemRoutes;
