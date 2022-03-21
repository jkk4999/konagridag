module.exports = async function (fastify, options, next) {
  fastify.post("/knexSelect", async function (request, reply) {
    const knex = fastify.knex;

    // body contains array of row ids
    const payload = request.body;
    const table = payload.table;
    const columns = payload.columns;
    const rowIds = payload.rowIds;
    const idField = payload.idField;

    // values should never be null
    const values = payload.values;

    // construct object query
    const whereObj = {};

    for (const [key, value] of Object.entries(values)) {
      whereObj[key] = value;
    }

    try {
      let records = null;

      if (rowIds && rowIds.length > 0) {
        // get records matching recordIds
        if (columns === null) {
          // return all columns
          records = await knex.select().from(table).whereIn(idField, rowIds);
        } else {
          // return specified columns
          records = await knex
            .select(columns)
            .from(table)
            .whereIn(idField, rowIds);
        }
      } else {
        // get records by condition
        if (columns === null) {
          // return all columns
          records = await knex.select().from(table).where(whereObj);
        } else {
          records = await knex.select(columns).from(table).where(whereObj);
        }
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
