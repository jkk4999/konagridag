module.exports = async function (fastify, options, next) {
  fastify.post("/knexDelete", async function (req, reply) {
    const knex = fastify.knex;

    // body contains array of row ids
    const payload = req.body;
    const table = payload.table;
    const columns = payload.columns;
    const values = payload.values;
    const rowIds = payload.rowIds;
    const idField = payload.idField;

    // construct object query
    const whereObj = {};

    for (const [key, value] of Object.entries(values)) {
      whereObj[key] = value;
    }

    let deletedRecords = null;
    try {
      if (rowIds.length === 0) {
        // delete a single record
        deletedRecords = await knex(table)
          .where(whereObj)
          .returning(columns)
          .del();
      } else {
        deletedRecords = await knex(table)
          .whereIn(idField, rowIds)
          .returning(columns)
          .del();
      }
      return {
        status: "ok",
        errorMessage: null,
        records: deletedRecords,
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

