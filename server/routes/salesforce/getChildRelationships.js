module.exports = async function (fastify, options, next) {
  fastify.post("/getChildRelationships", async function (request, reply) {
    try {
      const payload = request.body;
      const objName = payload.selectedObject;
      var conn = fastify.conn;

      const describeSObjectResult = await conn.describe(objName);
      const relationships = describeSObjectResult.childRelationships;

      const childRelationships = [];
      relationships.forEach((el, index) => {
        const newRelation = {};
        newRelation.childObject = el.childSObject;
        newRelation.relationshipName = el.relationshipName;
        childRelationships.push({
          newRelation,
        });
      });

      return childRelationships;
      // return response.records;
    } catch (err) {
      fastify.log.error(err);
      return { error: err.toString() };
    }
  });

  next();
}

