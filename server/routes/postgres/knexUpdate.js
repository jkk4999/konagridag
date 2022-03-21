module.exports = async function (fastify, options, next) {
  fastify.post("/knexUpdate", async function (request, reply) {
    const knex = fastify.knex;

    // body contains array of row ids
    const payload = request.body;
    const table = payload.table;
    const columns = payload.columns;
    const values = payload.values;

    // construct where clause
    const whereObj = {};
    whereObj["id"] = values.id;

    // construct object query
    const updateObj = {};

    for (const [key, value] of Object.entries(values)) {
      if (key !== "id") {
        updateObj[key] = value;
      }
    }

    try {
      const records = await knex(table)
        .where(whereObj)
        .update(updateObj, columns);
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
}
