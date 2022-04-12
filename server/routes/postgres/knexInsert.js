module.exports = async function (fastify, options, next) {
  fastify.post("/knexInsert", async function (request, reply) {
    // used to insert and update Postgres tables

    const knex = fastify.knex;

    // body contains array of row ids
    const payload = request.body;
    const table = payload.table;
    const columns = payload.columns;
    const values = payload.values;
    const key = payload.key;

    // add id to column set
    // columns.unshift("id");

    try {
      const records = await knex(table)
        .insert(values)
        // .insert(values, columns)
        .onConflict(key)
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
