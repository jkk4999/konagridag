module.exports = async function (fastify, options, next) {
   fastify.post("/sobjectCreate", async function (request, reply) {
      // try {
      var conn = fastify.conn;
  
      const payload = request.body;
      const objName = payload.sobject;
      const records = payload.records;
  
      try {
        let response = await conn
          .sobject(objName)
          .create(records, { allowRecursive: true });
  
        let result = [];
  
        response.forEach((res) => {
          let recResult = {};
          if (res.success === false) {
            const firstError = res.errors[0];
            recResult["error"] = firstError.message;
          } else {
            recResult["id"] = res.id;
            recResult["success"] = true;
          }
          result.push(recResult);
        });
        return result;
      } catch (error) {
        return error;
      }
    });

  next();
}

