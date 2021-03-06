module.exports = async function (fastify, options, next) {
  fastify.post("/sobjectUpdate", async function (request, reply) {
    // try {
    var conn = fastify.conn;

    const payload = request.body;
    const objName = payload.sobject;
    const records = payload.records;

    let response = null;

    try {
      let response = await conn
        .sobject(objName)
        .update(records, { allowRecursive: true });

      let result = [];

      response.forEach((res, index) => {
        let recResult = {};
        recResult["id"] = res.id;
        if (res.success === false) {
          const firstError = res.errors[0];
          recResult.id = records[index].Id;
          recResult["status"] = firstError.message;
        } else {
          recResult["id"] = res.id;
          recResult["status"] = "ok";
        }
        result.push(recResult);
      });

      return result;
    } catch (error) {
      return {
        errorMessage: error.message,
      };
    }
  });

  next();
};
