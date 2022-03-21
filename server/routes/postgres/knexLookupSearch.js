module.exports = async function (fastify, options, next) {
  fastify.post("/knexLookupSearch", async function (request, reply) {
    const knex = fastify.knex;

    const payload = request.body;
    const table = payload.table;
    const columns = payload.columns;
    const lookupField = payload.lookupField;
    const lookupValue = payload.lookupValue;

    try {
      let records = null;
      // get records by condition
      if (columns === null) {
        // return all columns
        records = await knex
          .select()
          .from(table)
          .where(`${lookupField}`, "like", `%${lookupValue}%`);
      } else {
        records = await knex
          .select(columns)
          .from(table)
          .where(`${lookupField}`, "like", `%${lookupValue}%`);
      }

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
