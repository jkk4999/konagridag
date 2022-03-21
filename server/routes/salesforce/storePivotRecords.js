module.exports = async function (fastify, options, next) {
  fastify.post("/storePivotRecords", async function (request, reply) {
    try {
      const payload = request.body;
      const conn = fastify.conn;
      const records = payload.records;

      fastify.pivotData.set(
        fastify.pivotData.splice(0, fastify.pivotData.length)
      );
      fastify.pivotData.set([...records]);

      const data = fastify.pivotData.get();

      return true;
      // return response.records;
    } catch (err) {
      return { error: err.toString() };
    }
  });

  next();
}

