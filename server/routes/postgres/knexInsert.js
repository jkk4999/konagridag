module.exports = async function (fastify, options, next) {
  fastify.post("/knexInsert", async function (request, reply) {
    const knex = fastify.knex;

    // body contains array of row ids
    const payload = request.body;
    const table = payload.table;
    const columns = payload.columns;
    const values = payload.values;

    // add id to column set
    // columns.unshift("id");

    try {
      const records = await knex(table)
        .insert(values, columns)
        .onConflict("id")
        .merge()
        .returning("*");
      return {
        status: "ok",
        errorMessage: null,
        records: records,
      };
    } catch (error) {
      return {
        status: "error",
        errorMessage: error.message,
        records: [],
      };
    }
  });

  next();
};
