module.exports = async function (fastify, options, next) {
  fastify.post("/removeCalendar", async function (request, reply) {
    const payload = request.body;
    const orgId = payload.orgId;
    const userId = payload.userId;
    const calenderId = payload.calenderId;

    var conn = fastify.conn;

    try {
      return {
        status: "ok",
        errorMessage: null,
        records: [],
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

