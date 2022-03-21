module.exports = async function (fastify, options, next) {
  async function getObjectMetadata2(
    conn,
    objName,
    metadataMap,
    userInfo,
    hostName,
    superagent
  ) {
    const url = `${hostName}/api/sObjectFieldsDescribe`;

    try {
      const result = await superagent.post(url).send({
        sobject: objName,
        profileName: userInfo.profileName,
        profileId: userInfo.profileId,
      });

      return {
        status: "ok",
        response: result.body,
      };
    } catch (error) {
      return {
        status: "error",
        response: error.message,
      };
    }
  }

  async function getReferenceFields(
    field,
    conn,
    objectName,
    metadataMap,
    userInfo,
    hostName,
    superagent
  ) {
    /*
          For reference type fields, returns the parent object fields  
          Ex: CreatedById has a lookup to User
          CreatedById >> CreatedBy.Name, CreatedBy.Department, CreatedBy.Email, etc
      */

    const fieldName = field.name;

    // handle special use cases
    if (fieldName === "MasterRecordId" || fieldName === "ParentId") {
      return [field.name];
    }

    if (fieldName === "CaseId") {
      return [field.name, "Case.CaseNumber"];
    }

    if (fieldName === "ContractId") {
      return [field.name, "Contract.ContractNumber"];
    }

    if (fieldName === "SolutionId") {
      return [field.name, "Solution.SolutionName"];
    }

    // HANDLE POLYMORPHIC FIELDS

    // assume name field exists for WhatId reference
    if (field.name === "WhatId") {
      let clause = `TYPEOF What WHEN Account THEN Name ELSE Name END`;
      return [field.name, clause];
    }

    // assume name field exists for WhoId reference
    if (field.name === "WhoId") {
      let clause = `TYPEOF Who WHEN Lead THEN Name ELSE Name END`;
      return [field.name, clause];
    }

    // special use case for Notes and Attachments
    // assume name field exists for Note and Attachment references
    if (
      field.name === "ParentId" &&
      (objName === "Attachment" || objName === "Note")
    ) {
      let clause = `TYPEOF ParentId WHEN Account THEN Name ELSE Name END`;
      return [field.name, clause];
    }

    // PROCESS OTHER FIELD TYPES

    let objMetadata = metadataMap.get(objectName);

    if (objMetadata === undefined || objMetadata.length === 0) {
      return [field.name];
    }

    const objMetadataFields = objMetadata.fields;
    const fieldMetadata = objMetadataFields.find((f) => f.name === field.name);

    // not a reference field
    if (fieldMetadata.dataType !== "reference") {
      return [field.name];
    }

    let relation = null;

    const referenceTo = field.referenceTo[0];

    // get the parent object fields
    let relatedObjMetadata = metadataMap.get(referenceTo);
    if (!relatedObjMetadata) {
      let metadataResult = await getObjectMetadata2(
        conn,
        referenceTo,
        metadataMap,
        userInfo,
        hostName,
        superagent
      );

      if (metadataResult.status !== "ok") {
        return [];
      } else {
        relatedObjMetadata = metadataResult.response;
      }
    }

    const relatedObjMetadataFields = relatedObjMetadata.fields;

    // standard relation
    if (fieldName.slice(-2) === "Id") {
      relation = fieldName.slice(0, -2);
    }

    // custom relation
    if (fieldName.slice(-3) === "__c") {
      relation = fieldName.slice(0, -1);
      relation.push("r");
    }

    const nameField = relatedObjMetadataFields.find((f) => f.name === "Name");

    if (nameField) {
      const relationName = `${relation}.Name`;
      return [field.name, relationName];
    } else {
      return [field.name];
    }
  }

  fastify.post("/getResourceEvents", async function (request, reply) {
    const payload = request.body;
    const resourceCalendarId = payload.resourceCalendarId;

    var conn = fastify.conn;
    var userInfo = fastify.userInfo;
    var hostName = request.headers.host;

    // libraries for node http requests
    const superagent = fastify.superagent;

    // holds the select clause fields
    let fieldsArray = [];

    const records = [];

    let response = {};
    let result = null;
    let eventIds = [];

    const metadataMap = fastify.metadataMap;
    // GET THE METADATA IF NEEDED
    let objMetadata = metadataMap.get("Event");
    if (!objMetadata) {
      // get the metadata for this object
      let metadataResult = await getObjectMetadata2(
        conn,
        "Event",
        metadataMap,
        userInfo,
        hostName,
        superagent
      );

      if (metadataResult.status !== "ok") {
        return [];
      } else {
        objMetadata = metadataResult.response;
      }
    }
    let fields = objMetadata.fields;

    // GET FIELDS FOR EVENT
    for (let i = 0; i < fields.length; i++) {
      const field = fields[i];

      // returns the field
      // if reference field, returns relationship.Name if exists
      const referenceFieldsArray = await getReferenceFields(
        field,
        conn,
        "Event",
        metadataMap,
        userInfo,
        hostName,
        superagent
      );

      // returns the field and the relation field (if appropriate)
      // add fields to select clause
      for (let i = 0; i < referenceFieldsArray.length; i++) {
        const refField = referenceFieldsArray[i];
        fieldsArray.push(refField);
      }
    }

    const query = `SELECT Id, RelationId, Relation.Name, EventId FROM EventRelation WHERE RelationId = '${resourceCalendarId}'`;

    try {
      result = await conn.query(query);
      result.records.forEach((r) => {
        eventIds.push(r.EventId);
      });

      await conn
        .sobject("Event")
        .find({ Id: { $in: eventIds }, fieldsArray }) // "fields" argument is omitted
        .execute(function (err, records) {
          if (err) {
            throw new Error(err);
          }
          response = {
            status: "ok",
            records: records,
          };
        });
    } catch (error) {
      response = {
        status: "error",
        errorMessage: error.message,
      };
    }

    return response;
  });

  next();
}

