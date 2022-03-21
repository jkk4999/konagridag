module.exports = async function (fastify, options, next) {
   fastify.get("/sobject", async function (request, reply) {
      // gets metadata for selected object
  
      try {
        const objName = request.query.sobjectName;
        var conn = fastify.conn;
  
        // get the org metadata using describeGlobal
        let meta = await conn.sobject(objName).describe();
  
        const data1 = meta.fields;
  
        data1.sort((a, b) => {
          let val1 = a.name;
          let val2 = b.name;
          return val1.localeCompare(val2);
        });
  
        const describeFields = [];
        data1.forEach((el) => {
          describeFields.push(el.name);
        });
  
        const response2 = await conn.query(
          `Select ${describeFields}
             From ${objName}`
        );
  
        return response2.records;
  
        // return response.records;
      } catch (err) {
        return { error: err.toString() };
      }
    });

  next();
}

