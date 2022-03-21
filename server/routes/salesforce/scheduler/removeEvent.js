module.exports = async function (fastify, options, next) {
  fastify.post("/removeEvent", async function (request, reply) {
    // try {
    var conn = fastify.conn;

    const payload = request.body;
    const objName = payload.sobject;
    const recordIds = payload.recordIds; // arrray of record ids

    try {
      let response = await conn
        .sobject(`${objName}`)
        .delete(recordIds, { allowRecursive: true });

      let result = [];
      let errors = [];
      let deletedIds = [];

      response.forEach((res) => {
        let recResult = {};
        if (res.success === false) {
          recResult.status = "error";
          recResult.errorMessage = res.errors[0];
          errors.push(recResult);
        } else {
          recResult.status = "ok";
          recResult.id = res.id;
          deletedIds.push(recResult);
        }
      });

      result = {
        records: deletedIds,
        errors: errors,
      };

      return result;
    } catch (error) {
      result = {
        status: "error",
        errorMessage: error.message,
      };
      return result;
    }
  });

  next();
}

