module.exports = async function (fastify, options, next) {
  fastify.post("/getRelatedRecords", async function (request, reply) {
    // returns a list of records (in a reponse object) for the selected object
    //NOTE: USE SINGLE QUOTES FOR BIND VARIABLE

    try {
      const payload = request.body;
      const parentObjName = payload.parentObjName;
      const parentRecordId = payload.parentRecordId;
      const objName = payload.objName;
      const relationships = payload.lookupRelationships;

      let results = [];
      let userIds = [];
      let whoIds = [];
      const userMap = new Map();
      const contactMap = new Map();
      const leadMap = new Map();

      var conn = fastify.conn;

      let lookupField = null;
      if (objName === "Task" || objName === "Event") {
        lookupField = "WhatId";
      } else if (objName === parentObjName) {
        lookupField = `ParentId`;
      } else {
        lookupField = `${parentObjName}Id`;
      }

      const findStr = `{${lookupField}: ${parentRecordId}}`;

      const findObj = {};
      findObj[lookupField] = parentRecordId;

      // const response = await conn.sobject(objName).find(findObj);

      let selectClause = "*";
      relationships.forEach((rel) => {
        // bug fix
        if (
          rel !== "User" &&
          rel !== "Individual" &&
          rel !== "DandBCompany" &&
          rel !== "OperatingHours"
        ) {
          selectClause += `, ${rel}.*`;
        }
      });

      await conn
        .sobject(objName)
        .select(selectClause)
        .where(findObj)
        .execute(
          { autoFetch: true, maxFetch: 100000 },
          function (err, records) {
            for (var i = 0; i < records.length; i++) {
              var record = records[i];
              userIds.push(record.OwnerId);
              whoIds.push(record.WhoId);

              // add the WhatId relation to the record
              record.WhatIdRelation = { Name: parentObjName };
            }
            results = records;
          }
        );

      // get the user info for each record
      const hasUserRel = relationships.find((f) => f === "User");
      if (hasUserRel) {
        await conn
          .sobject("User")
          .select("*")
          .where({ Id: { $in: userIds } })
          .execute(
            { autoFetch: true, maxFetch: 100000 },
            function (err, records) {
              for (var i = 0; i < records.length; i++) {
                var record = records[i];
                // store in a map
                userMap.set(record.Id, record);
              }
            }
          );
      }

      results.forEach((rec) => {
        if (userMap.has(rec.OwnerId)) {
          rec.User = userMap.get(rec.OwnerId);
        }
      });

      // if this is a task query, determine whether the WhoId field
      // points to a Contact or Lead
      // then add that relationship to the record

      if (objName === "Task" || objName === "Event") {
        // check for lead
        await conn
          .sobject("Lead")
          .select("*")
          .where({ Id: { $in: whoIds } })
          .execute(
            { autoFetch: true, maxFetch: 100000 },
            function (err, records) {
              for (var i = 0; i < records.length; i++) {
                var record = records[i];
                // store in a map
                leadMap.set(record.Id, record);
              }
            }
          );

        if (leadMap.size > 0) {
          results.forEach((rec) => {
            if (leadMap.has(rec.whoId)) {
              rec.Lead = leadMap.get(rec.WhoId);
            }
          });
        }

        // check for contact
        await conn
          .sobject("Contact")
          .select("*")
          .where({ Id: { $in: whoIds } })
          .execute(
            { autoFetch: true, maxFetch: 100000 },
            function (err, records) {
              for (var i = 0; i < records.length; i++) {
                var record = records[i];
                // store in a map
                contactMap.set(record.Id, record);
              }
            }
          );

        if (contactMap.size > 0) {
          results.forEach((rec) => {
            if (contactMap.has(rec.WhoId)) {
              rec.Contact = contactMap.get(rec.WhoId);
            }
          });
        }
      }

      return results;

      // return response.records;
    } catch (err) {
      return { error: err.toString() };
    }
  });

  next();
}

