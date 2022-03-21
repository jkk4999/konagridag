module.exports = async function (fastify, options, next) {
  fastify.post("/updateEvent", async function (request, reply) {
    var conn = fastify.conn;

    const payload = request.body;
    const objName = payload.sobject;
    const records = payload.records;

    let response = null;

    let result = [];
    let recResult = {};

    try {
      response = await conn
        .sobject(objName)
        .update(records, { allowRecursive: true });

      response.forEach((res) => {
        recResult = {};
        if (res.success === false) {
          const firstError = res.errors[0];
          recResult.status = "error";
          recResult.errorMessage = firstError.message;
        } else {
          recResult.status = "ok";
          recResult.id = res.id;
        }
        result.push(recResult);
      });

      return result;
    } catch (error) {
      return result;
    }
  });

  next();
}

