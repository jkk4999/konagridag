// url = api/lookupSearch

module.exports = async function (fastify, options) {
  fastify.post("/lookupSearch", async function (request, reply) {
    // returns a list of records (in a reponse object) for the selected object
    //NOTE: USE SINGLE QUOTES FOR BIND VARIABLE

    try {
      const payload = request.body;
      const objName = payload.object;
      const fieldName = payload.fieldName;
      const searchVal = payload.searchVal;

      var conn = fastify.conn;

      const findCriteria = { $like: `${searchVal}%` };
      const findObj = {};
      findObj[fieldName] = findCriteria;
      let sortObj = {};
      sortObj[fieldName] = `${fieldName}: 1`;

      const response = await conn
        .sobject(objName)
        .find(findObj)
        .limit(10)
        .sort(sortObj);

      return {
        status: "ok",
        errorMessage: null,
        records: response,
      };
    } catch (err) {
      return {
        status: "error",
        error: err.message,
        records: [],
      };
    }
  });
};
