module.exports = async function (fastify, options, next) {
  fastify.post("/fieldPermissions", async function (request, reply) {
    try {
      var conn = fastify.conn;

      const payload = request.body;
      const profileName = payload.profileName;
      const object = payload.object;

      const response = await conn.query(
        `Select SobjectType, Field, Parent.Name, PermissionsRead, PermissionsEdit 
       From FieldPermissions
       WHERE SobjectType = '${object}' AND ParentId IN ( SELECT Id 
          FROM PermissionSet 
          WHERE PermissionSet.Profile.Name = '${profileName}')
       Order By Field`
      );
      return response.records;
    } catch (err) {
      fastify.log.error(err);
      return { error: err.toString() };
    }
  });

  next();
}

