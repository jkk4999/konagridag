module.exports = async function (fastify, options, next) {
  fastify.post("/addEvent", async function (request, reply) {
    const payload = request.body;
    const records = payload.records;

    var conn = fastify.conn;

    let result = [];
    let response = null;
    let recResult = {};

    // create event for user
    //returns id
    try {
      response = await conn
        .sobject("Event")
        .create(records, { allowRecursive: true });

      response.forEach((res) => {
        recResult = {};
        if (res.success === false) {
          recResult.status = "error";
          recResult.errorMessage = res.errors[0];
        } else {
          recResult.status = "ok";
          recResult.id = res.id;
        }
        result.push(recResult);
      });
    } catch (error) {
      const errorResponse = {
        status: "error",
        errorMessage: error.message,
      };

      return errorResponse;
    }
    return result;
  });

  next();
}
