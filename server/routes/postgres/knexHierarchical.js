module.exports = async function (fastify, options, next) {
  fastify.post("/knexHierarchical", async function (request, reply) {
    const knex = fastify.knex;

    const payload = request.body;
    const table = payload.table;
    const columns = payload.columns;
    const parentField = payload.parentField;
    const parentValue = payload.parentValue;
    const childField = payload.childField;
    const orgid = payload.orgid;

    try {
      let records = null;

      records = await knex
        .withRecursive(
          "rec",
          knex.raw(`SELECT * FROM task WHERE (id = '${parentValue}' AND orgid = '${orgid}')
        UNION
            SELECT t.*
            FROM task t
            JOIN rec rt ON rt.id = t.parent`)
        )
        .select("*")
        .from("rec");

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

