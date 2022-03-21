module.exports = async function (fastify, options, next) {
  fastify.post("/getSections", async function (request, reply) {
    const payload = request.body;
    const OwnerId = payload.ownerId;

    var conn = fastify.conn;
    const records = [];

    const reponse = {};

    // get all events for user
    try {
      // UNCOMMENT AFTER WE IMPLEMENT ABLITY TO CREATE RESOURCES
      /*
        let result = await conn
          .sobject("Section")
          .find({ OwnerId: OwnerId }) // "fields" argument is omitted
          .execute(function (err, records) {
            if (err) {
              throw new Error(err);
            }
          });
          */

      response.status = "ok";
      response.records = records;
      return response;
    } catch (error) {
      response.status = "error";
      response.errorMessage = error.message;
      return reponse;
    }
  });

  next();
}

