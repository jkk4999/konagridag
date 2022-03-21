module.exports = async function (fastify, options, next) {
  fastify.post("/knexRaw", async function (request, reply) {
    const knex = fastify.knex;

    // body contains array of row ids
    const payload = request.body;
    const query = payload.query;

    try {
      const result = await knex.raw(query);

      return result;
    } catch (error) {
      // rethrow the error so we catch in the calling code
      throw new Error(error);
    }
  });

  next();
}


