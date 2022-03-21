module.exports = async function (fastify, options, next) {
  fastify.post("/knexGanttLinks", async function (request, reply) {
    const knex = fastify.knex;

    // body contains array of row ids
    const payload = request.body;
    const table = payload.table;
    const columns = payload.columns;
    const taskIds = payload.taskIds;
    const parentField = payload.parentField;
    const childField = payload.childField;
    const orgid = payload.orgid;

    try {
      if (taskIds && taskIds.length > 0) {
        // get records matching recordIds

        // get links for source
        // return all columns
        let records = await knex
          .select()
          .from(table)
          // .where((orgid = `'${orgid}'`))
          .whereIn(parentField, taskIds);

        let resultArray = records;

        return {
          status: "ok",
          errorMessage: null,
          records: resultArray,
        };
      }
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

