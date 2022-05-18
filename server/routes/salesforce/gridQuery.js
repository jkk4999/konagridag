module.exports = async function (fastify, options, next) {
  // query batch processor
  async function processBatch(
    recordIds,
    objName,
    fields,
    whereClause,
    conn
    // childRelationshipMap
  ) {
    return new Promise((resolve, reject) => {
      // build the id condition
      let idStr = "";
      recordIds.forEach((el) => {
        idStr += `'${el.Id}', `;
      });

      // remove last comma
      const recordIdStr = idStr.slice(0, -2);

      let idArray = [];
      recordIds.forEach((el) => {
        idArray.push(el.Id);
      });

      // convert comma delimited field string to array
      var fieldArrayStart = fields.split(",");
      const soqlFields = {};
      fieldArrayStart.forEach((field) => {
        soqlFields[`${field}`] = 1;
      });

      let soqlQuery = `SELECT ${fields} FROM ${objName}`;

      if (whereClause !== "") {
        soqlQuery += ` WHERE (${whereClause}) AND Id IN (${recordIdStr})`;
      } else {
        soqlQuery += ` WHERE Id IN (${recordIdStr})`;
      }

      conn
        .query(soqlQuery)
        .execute({ autoFetch: true, maxFetch: 50000 }, function (err, records) {
          if (err) {
            reject(err);
          }
          resolve(records);
        });
    });
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
        console.log(`Server getting metadata for ${referenceTo}`);
        let metadataResult = await getObjectMetadata(
          conn,
          referenceTo,
          userInfo,
          metadataMap,
          superagent,
          hostName
        );

        if (metadataResult.status !== "ok") {
          throw new Error(metadataResult.errorMessage);
        } else {
          relatedObjMetadata = metadataResult.records;

          // store server metadata
          metadataMap.set(referenceTo, relatedObjMetadata);
        }
      }

      // standard relation
      if (fieldName.slice(-2) === "Id") {
        relation = fieldName.slice(0, -2);
      }

      // custom relation
      if (fieldName.slice(-3) === "__c") {
        relation = fieldName.slice(0, -1);
        relation = relation + "r";
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

  async function getObjectMetadata(
    conn,
    objName,
    userInfo,
    metadataMap,
    superagent,
    hostName
  ) {
    try {
      // get the org metadata using describeGlobal
      let response = await conn.sobject(objName).describe();

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

  function getFieldDataType(fieldName, objFields, obName) {
    let fieldDataType = null;

    // const objMetadata = metadataMap.get(objName);
    // const objFields = objMetadata.fields;
    const objField = objFields.find((f) => f.name === fieldName);
    fieldDataType = objField.dataType;
    return fieldDataType;
  }

  function getInnerSQL(rule, objFields, objName) {
    try {
      const { field, label, operator, type, value } = rule;

      const fieldDataType = getFieldDataType(field, objFields, objName);

      // to support between operation
      // between only for non-string values
      let filterStartValue = null;
      let filterEndValue = null;

      if (operator == "between" || operator == "notBetween") {
        filterStartValue = value[0];
        filterEndValue = value[1];
      }

      // if operator === 'picklist'
      // create a comma-seperated list for the SOQL IN clause
      // picklist operator valid for string values only
      let valuesArray = [];
      let filterValue = null;
      let filterValues = [];
      if (value !== null && fieldDataType === "picklist") {
        const numValues = value.length;
        value.forEach((el, index) => {
          filterValues = filterValues + `'${el}'`;
          if (index < numValues - 1) {
            filterValues = filterValues + ", ";
          }
        });
        const a = 1;
      }

      let whereClause = "";

      switch (operator) {
        case "equal":
          if (
            fieldDataType === "decimal" ||
            fieldDataType === "currency" ||
            fieldDataType === "double" ||
            fieldDataType === "integer" ||
            fieldDataType === "long" ||
            fieldDataType === "boolean"
          ) {
            // non-string values are not quoted
            return {
              status: "ok",
              sql: `${field} = ${filterValue}`,
            };
          } else if (
            fieldDataType === "string" ||
            fieldDataType === "encryptedstring" ||
            fieldDataType === "id"
          ) {
            // string values are quoted
            return { status: "ok", sql: `${field} = '${filterValue}'` };
          } else if (fieldDataType === "date") {
            const aDate = new Date(filterValue);
            const aDateLiteral = SfDate.toDateLiteral(aDate);
            return { status: "ok", sql: `${field} = ${aDateLiteral}` };
          } else if (fieldDataType === "datetime") {
            const aDate = new Date(filterValue);
            const aDateLiteral = SfDate.toDateTimeLiteral(aDate);
            return { status: "ok", sql: `${field} = ${aDateLiteral}` };
          } else if (fieldDataType === "picklist") {
            // picklist input field is multi-select
            // so implement using IN
            return { status: "ok", sql: `${field} IN (${filterValues})` };
          } else {
            // treat other data types as string
            // NEED TO REVIEW THIS EX: BLOBS, ETC.
            return { status: "ok", sql: `${field} = '${filter}'` };
          }
          break;
        case "notequal":
          // value could be a string or number
          if (
            fieldDataType === "decimal" ||
            fieldDataType === "currency" ||
            fieldDataType === "double" ||
            fieldDataType === "integer" ||
            fieldDataType === "long" ||
            fieldDataType === "boolean"
          ) {
            return { sql: `${field} <> ${filterValue}` };
          } else if (
            fieldDataType === "string" ||
            fieldDataType === "encryptedstring" ||
            fieldDataType === "id"
          ) {
            // string values are quoted
            return { status: "ok", sql: `${field} <> '${filterValue}'` };
          } else if (fieldDataType === "date") {
            const aDate = new Date(filterValue);
            const aDateLiteral = SfDate.toDateLiteral(aDate);
            return { status: "ok", sql: `${field} <> ${aDateLiteral}` };
          } else if (fieldDataType === "datetime") {
            const aDate = new Date(filterValue);
            const aDateLiteral = SfDate.toDateTimeLiteral(aDate);
            return { status: "ok", sql: `${field} <> ${aDateLiteral}` };
          } else if (fieldDataType === "picklist") {
            // picklist input field is multi-select
            // so implement using IN
            return { status: "ok", sql: `NOT ${field} IN (${filterValues})` };
          } else {
            return { status: "ok", sql: `${field} <> '${filterValue}'` };
          }
          break;
        case "in":
          // soql in clause needs comma-seperated list of values
          // get the values

          return { status: "ok", sql: `${field} IN (${filterValues})` };

          break;
        case "notin":
          // soql in clause needs comma-seperated list of values
          // get the values

          return { status: "ok", sql: `NOT ${field} IN (${filterValues})` };

          break;
        case "contains":
          // convert to LIKE
          return { sql: `${field} LIKE '%${filterValue}%'` };
          break;
        case "notcontains":
          // convert to LIKE
          return { status: "ok", sql: `NOT ${field} LIKE '%${filterValue}%'` };
          break;
        case "lessorequal":
          // valid for numbers and dates
          if (fieldDataType === "date") {
            const aDate = new Date(filterValue);
            const aDateLiteral = SfDate.toDateLiteral(aDate);
            return { status: "ok", sql: `${field} <= ${aDateLiteral}` };
          } else if (fieldDataType === "datetime") {
            const aDate = new Date(filterValue);
            const aDateLiteral = SfDate.toDateTimeLiteral(aDate);
            return { status: "ok", sql: `${field} <= ${aDateLiteral}` };
          } else {
            return { status: "ok", sql: `${field} <= ${filterValue}` };
          }
          break;
        case "greaterorequal":
          // valid for numbers and dates
          if (fieldDataType === "date") {
            const aDate = new Date(filterValue);
            const aDateLiteral = SfDate.toDateLiteral(aDate);
            return { status: "ok", sql: `${field} >= ${aDateLiteral}` };
          } else if (fieldDataType === "datetime") {
            const aDate = new Date(filterValue);
            const aDateLiteral = SfDate.toDateTimeLiteral(aDate);
            return { status: "ok", sql: `${field} >= ${aDateLiteral}` };
          } else {
            return { status: "ok", sql: `${field} >= ${filterValue}` };
          }
          break;
        case "less":
          // valid for numbers and dates
          if (fieldDataType === "date") {
            const aDate = new Date(filterValue);
            const aDateLiteral = SfDate.toDateLiteral(aDate);
            return { status: "ok", sql: `${field} < ${aDateLiteral}` };
          } else if (fieldDataType === "datetime") {
            const aDate = new Date(filterValue);
            const aDateLiteral = SfDate.toDateTimeLiteral(aDate);
            return { status: "ok", sql: `${field} < ${aDateLiteral}` };
          } else {
            return { status: "ok", sql: `${field} < ${filterValue}` };
          }
          break;
        case "greater":
          // valid for numbers and dates
          if (fieldDataType === "date") {
            const aDate = new Date(filterValue);
            const aDateLiteral = SfDate.toDateLiteral(aDate);
            return { status: "ok", sql: `${field} > ${aDateLiteral}` };
          } else if (fieldDataType === "datetime") {
            const aDate = new Date(filterValue);
            const aDateLiteral = SfDate.toDateTimeLiteral(aDate);
            return {
              status: "ok",
              sql: `${field} > ${aDateLiteral}`,
              filterValue: [],
            };
          } else {
            return { status: "ok", sql: `${field} > ${filterValue}` };
          }
          break;
        case "beginswith":
          // valid for text
          return { status: "ok", sql: `${field} LIKE '${filterValue}%'` };
          break;
        case "notbeginswith":
          // valid for text
          return { status: "ok", sql: `NOT ${field} LIKE '${filterValue}%'` };
          break;
        case "endswith":
          // valid for text
          return { status: "ok", sql: `${field} LIKE '%${filterValue}'` };
          break;
        case "notendswith":
          // valid for text
          return { status: "ok", sql: `NOT ${field} LIKE '%${filterValue}'` };
          break;
        case "between":
          // for date and number fields
          if (fieldDataType === "date") {
            const startDate = new Date(filterStartValue);
            const startDateLiteral = SfDate.toDateLiteral(startDate);
            const endDate = new Date(filterEndValue);
            const endDateLiteral = SfDate.toDateLiteral(endDate);
            return {
              status: "ok",
              sql: `${field} >= ${startDateLiteral} AND ${field} <= ${endDateLiteral}`,
            };
          } else if (fieldDataType === "datetime") {
            const startDate = new Date(filterStartValue);
            const startDateLiteral = SfDate.toDateTimeLiteral(startDate);
            const endDate = new Date(filterEndValue);
            const endDateLiteral = SfDate.toDateTimeLiteral(endDate);
            return {
              status: "ok",
              sql: `${field} >= ${startDateLiteral} AND ${field} <= ${endDateLiteral}`,
            };
          } else {
            return {
              status: "ok",
              sql: `${field} >= ${filterValues.start} AND ${field} <= ${filterValuec.end}`,
            };
          }
          break;
        case "notbetween": {
          // for non-string values
          if (fieldDataType === "date") {
            const startDate = new Date(filterStartValue);
            const startDateLiteral = SfDate.toDateLiteral(startDate);
            const endDate = new Date(filterEndValue);
            const endDateLiteral = SfDate.toDateLiteral(endDate);
            return {
              status: "ok",
              sql: `${field} < ${startDateLiteral} OR ${field} > ${endDateLiteral}`,
            };
            break;
          } else if (fieldDataType === "datetime") {
            const startDate = new Date(filterStartValue);
            const startDateLiteral = SfDate.toDateTimeLiteral(startDate);
            const endDate = new Date(filterEndValue);
            const endDateLiteral = SfDate.toDateTimeLiteral(endDate);
            return {
              status: "ok",
              sql: `${field} < ${startDateLiteral} OR ${field} > ${endDateLiteral}`,
            };
            break;
          }
          break;
        }
        case "isnull": {
          return { status: "ok", sql: `${field} = null` };
          break;
        }
        case "isnotnull": {
          return { status: "ok", sql: `${field} != null` };
          break;
        }
        default: {
          // revisit this as we want to filter out queries with blobs, etc.
          return { status: "ok", sql: `${field} = '${filterValue}'` };
        }
      }
    } catch (error) {
      return { status: "error", errorMessage: error.message };
    }
  }

  function getSQL(query, objFields, objName) {
    const rules = query.rules;
    const condition = query.condition;

    let sql = [];
    let values = [];

    // create queue of the join conditions
    const conditionQueue = [];

    // initialize with top level condition
    conditionQueue.put(query.condition);

    for (let i = 0; i < rules.length; i++) {
      const rule = rules[i];
      if (rule.condition) {
        // we have a grouped query clause
        conditionQueue.push(rule.condition);
      }
      let response = getInnerSQL(rule, objFields, objName);
      if (response.status === "error") {
        throw new Error(response.errorMessage);
      }
      let subSQL = response.sql;

      sql.push(subSQL);
      console.log(subSQL);
    }

    // puts the AND/OR operator between the clauses
    let queryStr = "";
    if (rules.length > 1 && sql.length > 1) {
      queryStr = sql.join(` ${condition.toUpperCase()} `);
    } else {
      queryStr = sql[0];
    }

    console.log(queryStr);
    return queryStr;
  }

  fastify.post("/gridQuery", async function (request, reply) {
    var conn = fastify.conn;
    var userInfo = fastify.userInfo;
    var io = fastify.io;

    // libraries for node http requests
    const superagent = fastify.superagent;
    var hostName = request.headers.host;

    const payload = request.body;
    const objName = payload.objName;
    const whereClause = payload.whereClause;

    // holds the select clause fields
    let fields = "";
    let fieldsArray = [];

    let queryResult = [];
    let queryRecords = [];

    const metadataMap = fastify.metadataMap;

    try {
      // get main object metadata
      let objMetadata = metadataMap.get(objName);

      if (objMetadata === undefined) {
        console.log(`Server getting object metadata for ${objName}`);
        let result = await getObjectMetadata(
          conn,
          objName,
          userInfo,
          metadataMap,
          superagent,
          hostName
        );

        if (result.status === "error") {
          throw new Error(result.errorMessage);
        }

        objMetadata = result.records;

        // store server metadata
        metadataMap.set(objName, objMetadata);

        // get or create the objectMetadata
        // objMetadata = objectMetadata.find(
        //   (f) => f.objName === selectedObject.id
        // );
      }

      let objMetadataFields = objMetadata.fields;

      // get reference fields
      for (let i = 0; i < objMetadataFields.length; i++) {
        const field = objMetadataFields[i];

        // returns the field
        // if reference field, returns relationship.Name if exists
        const referenceResult = await getReferenceFields(
          field,
          conn,
          objName,
          metadataMap,
          userInfo,
          superagent,
          hostName
        );

        if (referenceResult.status === "error") {
          throw new Error(referenceResult.errorMessage);
        }

        let referenceFieldsArray = referenceResult.records;

        // add fields to select clause
        for (let i = 0; i < referenceFieldsArray.length; i++) {
          const refField = referenceFieldsArray[i];
          // console.log(`Adding ${refField}`);
          fieldsArray.push(refField);
        }
      }

      // convert fields array to comma-delimited string
      fields = fieldsArray.join();
      let finalFields = "";
      let values = null;
      let done = false;
      var perChunk = 250;

      // CREATE WHERE CLAUSE FROM QUERY CONDITIONS
      if (whereClause !== "") {
        let batchingQuery = false;
        let recordsReturned = 0;

        const idQuery = `SELECT Id FROM ${objName} WHERE ${whereClause}`;

        let idResults = await conn
          .query(idQuery)
          .execute({ autoFetch: true, maxFetch: 100000 });

        if (idResults.totalSize === 0) {
          return {
            status: "ok",
            errorMessage: null,
            records: [],
          };
        }

        // break up the record ids into chunks
        // var perChunk = 400;
        const recordIds = idResults.records;
        var idArray = recordIds.reduce((resultArray, item, index) => {
          const chunkIndex = Math.floor(index / perChunk);
          if (!resultArray[chunkIndex]) {
            resultArray[chunkIndex] = []; // start a new chunk
          }
          resultArray[chunkIndex].push(item);
          return resultArray;
        }, []);

        let batchCounter = 0;
        let numBatches = idArray.length;
        let recordsReceived = 0;

        // SOLUTION USING ASYNC PROMISES

        // create the array of PROMISES
        const promises = idArray.map((batch) =>
          processBatch(batch, objName, fields, whereClause, conn)
        );

        for (const batchPromise of promises) {
          batchCounter += 1;
          const batchResult = await batchPromise;
          queryRecords.push(batchResult.records);
        }

        fastify.pivotData = queryRecords;

        return {
          status: "ok",
          errorMessage: null,
          records: queryRecords,
        };
      } else {
        // query conditions are null or empty

        let countQuery = null;

        // get the Ids
        let idQuery = `SELECT Id FROM ${objName}`;

        let idResults = await conn
          .query(idQuery)
          .execute({ autoFetch: true, maxFetch: 100000 });

        if (idResults.totalSize === 0) {
          return {
            status: "ok",
            errorMessage: null,
            records: [],
          };
        }

        // break up the record ids into chunks
        const recordIds = idResults.records;
        var idArray = recordIds.reduce((resultArray, item, index) => {
          const chunkIndex = Math.floor(index / perChunk);
          if (!resultArray[chunkIndex]) {
            resultArray[chunkIndex] = []; // start a new chunk
          }
          resultArray[chunkIndex].push(item);
          return resultArray;
        }, []);

        let batchCounter = 0;
        let numBatches = idArray.length;
        let recordsReceived = 0;

        // SOLUTION USING ASYNC PROMISES

        // create the array of PROMISES
        const promises = idArray.map((batch) =>
          processBatch(batch, objName, fields, whereClause, conn)
        );

        for (const batchPromise of promises) {
          batchCounter += 1;
          const batchResult = await batchPromise;
          queryRecords.push(batchResult.records);
        }

        fastify.pivotData = queryRecords;

        return {
          status: "ok",
          errorMessage: null,
          records: queryRecords,
        };
      }
    } catch (error) {
      return {
        status: "error",
        errorMessage: error.message,
        records: [],
      };
    }
  });

  next();
};
