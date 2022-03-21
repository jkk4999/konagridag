module.exports = async function knexSelectJoin(fastify, options, next) {
  fastify.post("/knexSelectJoin", async function (request, reply) {
    const knex = fastify.knex;

    // body contains array of row ids
    const payload = request.body;
    const table = payload.table;
    const joinTable = payload.joinTable;
    const firstJoinColumn = payload.firstJoinColumn;
    const secondJoinColumn = payload.secondJoinColumn;
    // columns to return
    const columns = payload.columns;

    // values should never be null
    const values = payload.values;

    // construct object query
    const whereObj = {};

    // for (const [key, value] of Object.entries(values)) {
    //   whereObj[`${table}.${key}`] = value;
    // }

    for (const [key, value] of Object.entries(values)) {
      whereObj[key] = value;
    }

    try {
      // return all columns
      let result = await knex(table)
        .join(joinTable, firstJoinColumn, "=", secondJoinColumn)
        .where(whereObj)
        .select(columns);

      return {
        status: "ok",
        errorMessage: null,
        records: result,
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

