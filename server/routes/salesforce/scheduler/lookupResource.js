module.exports = async function (fastify, options, next) {
  fastify.post("/lookupResource", async function (request, reply) {
    // returns a list of records (in a reponse object) for the selected object
    //NOTE: USE SINGLE QUOTES FOR BIND VARIABLE

    try {
      const payload = request.body;
      const objName = payload.object;
      const fieldName = payload.fieldName;
      const searchVal = payload.searchVal;
      const type = payload.type;

      var conn = fastify.conn;

      const findCriteria = { $like: `${searchVal}%` };
      const findObj = {};
      findObj[fieldName] = findCriteria;
      findObj["Type"] = type;

      let sortObj = {};
      sortObj[fieldName] = `${fieldName}: 1`;

      const response = await conn
        .sobject(objName)
        .find(findObj)
        .limit(10)
        .sort(sortObj);

      return response;

      // return response.records;
    } catch (err) {
      return { error: err.toString() };
    }
  });

  next();
}

