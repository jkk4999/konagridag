module.exports = async function (fastify, options, next) {
  fastify.post("/getCalendars", async function (request, reply) {
    const payload = request.body;
    const UserId = payload.userId;
    const IsActive = payload.isActive;
    const Type = payload.type;
    // const Name = payload.name;
    // const Type = payload.type; // values: Holiday, Public, Resource, User

    var conn = fastify.conn;
    let records = [];

    let response = {};
    let result = null;

    // get a user calender OR a Holiday/Public/Resource calender depending on values

    if (UserId !== null) {
      try {
        result = await conn
          .sobject("Calendar")
          .find(
            {
              IsActive: IsActive,
              UserId: UserId,
              Type: Type,
            },
            ["Id", "Name", "Type", "UserId", "IsActive"]
          ) // Type = 'User'
          .execute(function (err, records) {
            if (err) {
              throw new Error(err);
            }
            response.status = "ok";
            response.records = records;
          });
      } catch (error) {
        response.status = "error";
        response.errorMessage = error.message;
      }
    } else {
      try {
        result = await conn
          .sobject("Calendar")
          .find(
            {
              IsActive: IsActive,
              Type: Type,
            },
            ["Id", "Name", "Type", "UserId", "IsActive"]
          ) // Type = 'User'
          .execute(function (err, records) {
            if (err) {
              throw new Error(err);
            }
            response.status = "ok";
            response.records = records;
          });
      } catch (error) {
        response.status = "error";
        response.errorMessage = error.message;
      }
    }

    return response;
  });

  next();
};

