module.exports = async function (fastify, options, next) {
  fastify.post("/sobjectUpsert", async function (request, reply) {
    // try {
    var conn = fastify.conn;

    const payload = request.body;
    const objName = payload.sobject;
    const records = payload.records;

    let response = null;

    try {
      let response = await conn.sobject(objName).upsert(records, "Id");

      let result = [];

      response.forEach((res) => {
        let recResult = {};
        if (res.success === false) {
          recResult["id"] = res.id;
          const firstError = res.errors[0];
          recResult["status"] = firstError.message;
        } else {
          recResult["id"] = res.id;
          recResult["status"] = "success";
        }
        result.push(recResult);
      });

      return {
        status: "ok",
        records: result,
      };
    } catch (error) {
      return {
        status: "error",
        errorMessage: error.message,
      };
    }
  });

  next();
};
