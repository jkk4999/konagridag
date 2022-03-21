module.exports = async function (fastify, options, next) {
  fastify.post("/knexUpdateTemplateOnly", async function (request, reply) {
    /*
    // pg client
    // const client = fastify.client;

    const db = fastify.db;
    const pgp = fastify.pgp;

    // 1 template record per request sent
    const templates = request.body;

    // UPDATING TEMPLATE RECORD
    try {
      // template columnSet
      const csTemplate = new pgp.helpers.ColumnSet(
        [
          "?id",
          // "orgid",
          "template_name",
          // "owner",
          "is_active",
          "is_public",
          "is_related",
          "description",
          "default",
          // "object",
        ],
        { table: "template" }
      );

      // update the template record(s)
      const update =
        pgp.helpers.update(templates, csTemplate) +
        " WHERE v.id = t.id" +
        " RETURNING *";

      // execute update
      const updatedTemplates = await db.any(update);

      return updatedTemplates;
    } catch (error) {
      throw new Error(`Error updating templates - ${error.message}`);
    }
    */
  });

  next();
};
