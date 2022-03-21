module.exports = async function (fastify, options, next) {
  fastify.post("/getUnits", async function (request, reply) {
    return {
      status: "ok",
      errorMessage: null,
      records: [],
    };
  });

  next();
}

