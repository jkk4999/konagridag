module.exports = async function (fastify, options, next) {
  async function getObjectMetadata(
    conn,
    objName,
    metadataMap,
    userInfo,
    superagent,
    hostName
  ) {
    try {
      // get the org metadata using describeGlobal
      let response = await conn.sobject(objName).describe();

      // store result in server metadata
      metadataMap.set(objName, response);

      // const payload = {
      //   objName: objName,
      //   profileName: userInfo.profileName,
      //   profileId: userInfo.profileId,
      // };

      // let response = await superagent
      //   .post(`${hostName}/api/sObjectFieldsDescribe`)
      //   .send({
      //     payload: payload,
      //   });

      return {
        status: "ok",
        errorMessage: null,
        records: response,
      };
    } catch (error) {
      return {
        status: "error",
        errorMessage: error.toString(),
        records: [],
      };
    }
  }

  async function getReferenceFields(
    field,
    conn,
    objectName,
    metadataMap,
    userInfo,
    superagent,
    hostName
  ) {
    /*
        For reference type fields, returns the parent object fields  
        Ex: CreatedById has a lookup to User
        CreatedById >> CreatedBy.Name, CreatedBy.Department, CreatedBy.Email, etc
    */

    try {
      const fieldName = field.name;

      // handle special use cases
      if (
        fieldName === "MasterRecordId" ||
        fieldName === "ParentId" ||
        fieldName === "DandbCompanyId" ||
        fieldName === "CallCenterId" ||
        fieldName === "DelegatedApproverId" ||
        fieldName === "BusinessProcessId"
      ) {
        return {
          status: "ok",
          errorMessage: null,
          records: [field.name],
        };
      }

      if (fieldName === "CaseId") {
        return {
          status: "ok",
          errorMessage: null,
          records: [field.name, "Case.CaseNumber"],
        };
      }

      if (fieldName === "ContractId") {
        return {
          status: "ok",
          errorMessage: null,
          records: [field.name, "Contract.ContractNumber"],
        };
      }

      if (fieldName === "SolutionId") {
        return {
          status: "ok",
          errorMessage: null,
          records: [field.name, "Solution.SolutionName"],
        };
      }

      // HANDLE POLYMORPHIC FIELDS

      // assume name field exists for WhatId reference
      if (field.name === "WhatId") {
        let clause = `TYPEOF What WHEN Account THEN Name ELSE Name END`;
        return {
          status: "ok",
          errorMessage: null,
          records: [field.name, clause],
        };
      }

      // assume name field exists for WhoId reference
      if (field.name === "WhoId") {
        let clause = `TYPEOF Who WHEN Lead THEN Name ELSE Name END`;
        return {
          status: "ok",
          errorMessage: null,
          records: [field.name, clause],
        };
      }

      // special use case for Notes and Attachments
      // assume name field exists for Note and Attachment references
      if (
        field.name === "ParentId" &&
        (objName === "Attachment" || objName === "Note")
      ) {
        let clause = `TYPEOF ParentId WHEN Account THEN Name ELSE Name END`;
        return {
          status: "ok",
          errorMessage: null,
          records: [field.name, clause],
        };
      }

      // special use case for ContactId on Opportunity
      // only exists for converted lead
      if (objectName === "Opportunity" && field.name === "ContactId") {
        return {
          status: "ok",
          errorMessage: null,
          records: [field.name],
        };
      }

      // PROCESS OTHER FIELD TYPES

      let objMetadata = metadataMap.get(objectName);

      if (objMetadata === undefined || objMetadata.length === 0) {
        return {
          status: "ok",
          errorMessage: null,
          records: [field.name],
        };
      }

      const objMetadataFields = objMetadata.fields;
      const fieldMetadata = objMetadataFields.find(
        (f) => f.name === field.name
      );

      if (fieldMetadata === undefined) {
        const a = 1;
      }

      // not a reference field
      if (fieldMetadata.dataType !== "reference") {
        return {
          status: "ok",
          errorMessage: null,
          records: [field.name],
        };
      }

      // reference field special case
      if (fieldName.slice(-2) === "Id" && fieldName.includes("History")) {
        return {
          status: "ok",
          errorMessage: null,
          records: [field.name],
        };
      }

      let relation = null;

      const referenceTo = field.referenceTo[0];

      // get the parent object fields
      let relatedObjMetadata = metadataMap.get(referenceTo);
      if (!relatedObjMetadata) {
        let metadataResult = await getObjectMetadata(
          conn,
          referenceTo,
          userInfo,
          superagent,
          hostName
        );

        if (metadataResult.status !== "ok") {
          throw new Error(metadataResult.errorMessage);
        } else {
          relatedObjMetadata = metadataResult.records;
        }
      }

      // standard relation
      if (fieldName.slice(-2) === "Id") {
        relation = fieldName.slice(0, -2);
      }

      // custom relation
      if (fieldName.slice(-3) === "__c") {
        relation = fieldName.slice(0, -1);
        relation.push("r");
      }

      const relatedObjMetadataFields = relatedObjMetadata.fields;
      const nameField = relatedObjMetadataFields.find((f) => f.name === "Name");

      // relationship has name field
      if (nameField !== undefined) {
        const relationName = `${relation}.Name`;

        return {
          status: "ok",
          errorMessage: null,
          records: [field.name, relationName],
        };
      }

      // return field name when relationship does not have name field
      return {
        status: "ok",
        errorMessage: null,
        records: [field.name],
      };
    } catch (error) {
      return {
        status: "error",
        errorMessage: error.message,
        records: null,
      };
    }
  }

  fastify.post("/getEvents", async function (request, reply) {
    const payload = request.body;
    const OwnerId = payload.OwnerId;

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

    const metadataMap = fastify.metadataMap;

    // GET THE METADATA IF NEEDED
    let objMetadata = metadataMap.get("Event");

    if (!objMetadata) {
      // get the metadata for this object
      let metadataResult = await getObjectMetadata(
        conn,
        "Event",
        metadataMap,
        userInfo,
        superagent,
        hostName
      );

      if (metadataResult.status !== "ok") {
        throw new Error(metadataResult.status);
      }
      objMetadata = metadataResult.response;
    }

    let fields = objMetadata.fields;

    // PROCESS THE MAIN OBJECT
    for (let i = 0; i < fields.length; i++) {
      const field = fields[i];

      // returns the field
      // if reference field, returns relationship.Name if exists
      const result = await getReferenceFields(
        field,
        conn,
        "Event",
        metadataMap,
        userInfo,
        superagent,
        hostName
      );

      if (result.status === "error") {
        throw new Error(result.errorMessage);
      }

      let referenceFieldsArray = result.records;

      // returns the field and the relation field (if appropriate)
      // add fields to select clause
      for (let i = 0; i < referenceFieldsArray.length; i++) {
        const refField = referenceFieldsArray[i];
        fieldsArray.push(refField);
      }
    }

    // get events by OwnerId
    try {
      result = await conn
        .sobject("Event")
        .find({ OwnerId: OwnerId }, fieldsArray)
        .execute(function (err, records) {
          if (err) {
            throw new Error(err);
          }
          return {
            status: "ok",
            errorMessage: null,
            records: records,
          };
        });
    } catch (error) {
      return {
        status: "error",
        errorMessage: error.message,
        records: [],
      };
    }
  });

  next();
}

