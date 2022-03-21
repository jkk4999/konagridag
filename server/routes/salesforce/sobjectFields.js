module.exports = async function (fastify, options, next) {
  fastify.post("/sobjectFields", async function (request, reply) {
    try {
      const payload = request.body;
      const objName = payload.sobjectName;
      var conn = fastify.conn;

      const response = await conn.query(
        `select QualifiedApiName, DeveloperName, DataType  
         from FieldDefinition 
         where EntityDefinition.QualifiedApiName = '${objName}'
         order by DeveloperName`
      );

      // return array of data
      return response.records;
    } catch (err) {
      return { error: err.toString() };
    }
  });

  next();
}
