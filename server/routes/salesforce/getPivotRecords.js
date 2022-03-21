module.exports = async function (fastify, options, next) {
  fastify.post("/getPivotRecords", async function (request, reply) {
    try {
      const payload = request.body;
      const conn = fastify.conn;
      const rootObjValue = payload.rootObjValue;
      const firstRelValue = payload.firstRelValue;
      // const secondRelValue = payload.secondRelValue;
      // const thirdRelValue = payload.thirdRelValue;

      return fastify.pivotData;
      // return response.records;
    } catch (err) {
      return { error: err.toString() };
    }
  });
  next();
}

