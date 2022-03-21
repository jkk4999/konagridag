module.exports = async function (fastify, options, next) {
  // query batch processor
  async function processBatch(
    recordIds,
    objName,
    fields,
    whereClause,
    relatedQueryClause,
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

      // if (childRelationshipMap.keys.length > 0) {
      //   childRelationshipMap.forEach((value, key) => {
      //     const objFields = value;
      //   });
      // }

      if (whereClause !== null) {
        soqlQuery += ` WHERE (${whereClause}) AND Id IN (${recordIdStr})`;
      } else {
        soqlQuery += ` WHERE Id IN (${recordIdStr})`;
      }

      if (relatedQueryClause !== null) {
        soqlQuery += ` AND ${relatedQueryClause}`;
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

  function getFieldDataType(fieldName, objFields, obName) {
    let fieldDataType = null;

    // const objMetadata = metadataMap.get(objName);
    // const objFields = objMetadata.fields;
    const objField = objFields.find((f) => f.name === fieldName);
    fieldDataType = objField.dataType;
    return fieldDataType;
  }

  function getSQL(query, objFields, objName) {
    const { rules, operator, value } = query;
    if (!rule) {
      // replace ? parameters with $1, $2, etc.
      var reg = /^[^?]*(\?)/;

      if (operator == "between" || operator == "notBetween") {
        if (filter.start === null) {
          filter = filter.end;
          type = "between" ? "lessOrEqual" : "greater";
        } else if (filter.end === null) {
          filter = filter.start;
          operator = "between" ? "greaterOrEqual" : "less";
        }
      }

      const values = data.condition.filter;
      let valuesArray = [];
      let whereClause = "";
      let firstWhereClause = "";

      const fieldDataType = getFieldDataType(data.field, objFields, objName);

      switch (operator) {
        case "equal":
          // value could be a string or number
          if (
            fieldDataType === "decimal" ||
            fieldDataType === "currency" ||
            fieldDataType === "double" ||
            fieldDataType === "integer" ||
            fieldDataType === "long"
          ) {
            return { sql: `${data.field} = ?`, values: [filter] };
          } else if (fieldDataType === "date") {
            const aDate = new Date(filter);
            const aDateLiteral = SfDate.toDateLiteral(aDate);
            return { sql: `${data.field} = ${aDateLiteral}`, values: [] };
          } else if (fieldDataType === "datetime") {
            const aDate = new Date(filter);
            const aDateLiteral = SfDate.toDateTimeLiteral(aDate);
            return { sql: `${data.field} = ${aDateLiteral}`, values: [] };
          } else {
            return { sql: `${data.field} = '${filter}'`, values: [] };
          }
          break;
        case "notEqual":
          // value could be a string or number
          if (
            fieldDataType === "decimal" ||
            fieldDataType === "currency" ||
            fieldDataType === "double" ||
            fieldDataType === "integer" ||
            fieldDataType === "long"
          ) {
            return { sql: `${data.field} <> ${filter}`, values: [] };
          } else if (fieldDataType === "date") {
            const aDate = new Date(filter);
            const aDateLiteral = SfDate.toDateLiteral(aDate);
            return { sql: `${data.field} <> ${aDateLiteral}`, values: [] };
          } else if (fieldDataType === "datetime") {
            const aDate = new Date(filter);
            const aDateLiteral = SfDate.toDateTimeLiteral(aDate);
            return { sql: `${data.field} <> ${aDateLiteral}`, values: [] };
          } else {
            return { sql: `${data.field} <> '${filter}'`, values: [] };
          }
          break;
        case "contains":
          // get the values
          valuesArray = values.split(",");

          // remove beginning spaces from value
          // needed when we have multiple values like type === contains
          for (let i = 0; i < valuesArray.length; i++) {
            const val = valuesArray[i];
            const newVal = val.trimLeft();
            valuesArray[i] = newVal;
          }

          if (fieldDataType === "reference") {
            firstWhereClause = `${data.field} = '?'`;
          } else {
            firstWhereClause = `${data.field} LIKE '%?%'`;
          }

          if (valuesArray.length > 0) {
            whereClause = firstWhereClause;

            // add additional OR clauses
            for (let i = 1; i < valuesArray.length; i++) {
              whereClause += ` OR ${firstWhereClause}`;
            }

            // set the Like values here for this case
            for (let i = 0; i < valuesArray.length; i++) {
              var match = reg.test(whereClause);
              if (match) {
                whereClause = whereClause.replace("?", valuesArray[i]);
              }
            }
            return { sql: `${whereClause}`, values: [] };
          }
          break;
        case "notContains":
          // get the values
          valuesArray = values.split(",");

          // remove spaces from values
          for (let i = 0; i < valuesArray.length; i++) {
            const val = valuesArray[i];
            const newVal = val.replace(/\s+/g, "");
            valuesArray[i] = newVal;
          }

          whereClause = "";
          firstWhereClause = `(NOT ${data.field} LIKE '%?%')`;
          if (valuesArray.length > 0) {
            whereClause = firstWhereClause;
            // add additional OR clauses
            for (let i = 1; i < valuesArray.length; i++) {
              whereClause += ` AND ${firstWhereClause}`;
            }
            // set the Like values here for this case
            for (let i = 0; i < valuesArray.length; i++) {
              var match = reg.test(whereClause);
              if (match) {
                whereClause = whereClause.replace("?", valuesArray[i]);
              }
            }
            return { sql: `${whereClause}`, values: [] };
          }
          break;
        case "lessOrEqual":
          // valid for numbers and dates
          if (fieldDataType === "date") {
            const aDate = new Date(filter);
            const aDateLiteral = SfDate.toDateLiteral(aDate);
            return { sql: `${data.field} <= ${aDateLiteral}`, values: [] };
          } else if (fieldDataType === "datetime") {
            const aDate = new Date(filter);
            const aDateLiteral = SfDate.toDateTimeLiteral(aDate);
            return { sql: `${data.field} <= ${aDateLiteral}`, values: [] };
          } else {
            return { sql: `${data.field} <= ${filter}`, values: [] };
          }
          break;
        case "greaterOrEqual":
          // valid for numbers and dates
          if (fieldDataType === "date") {
            const aDate = new Date(filter);
            const aDateLiteral = SfDate.toDateLiteral(aDate);
            return { sql: `${data.field} >= ${aDateLiteral}`, values: [] };
          } else if (fieldDataType === "datetime") {
            const aDate = new Date(filter);
            const aDateLiteral = SfDate.toDateTimeLiteral(aDate);
            return { sql: `${data.field} >= ${aDateLiteral}`, values: [] };
          } else {
            return { sql: `${data.field} >= ${filter}`, values: [] };
          }
          break;
        case "less":
          // valid for numbers and dates
          if (fieldDataType === "date") {
            const aDate = new Date(filter);
            const aDateLiteral = SfDate.toDateLiteral(aDate);
            return { sql: `${data.field} < ${aDateLiteral}`, values: [] };
          } else if (fieldDataType === "datetime") {
            const aDate = new Date(filter);
            const aDateLiteral = SfDate.toDateTimeLiteral(aDate);
            return { sql: `${data.field} < ${aDateLiteral}`, values: [] };
          } else {
            return { sql: `${data.field} < ${filter}`, values: [] };
          }
          break;
        case "greater":
          // valid for numbers and dates
          if (fieldDataType === "date") {
            const aDate = new Date(filter);
            const aDateLiteral = SfDate.toDateLiteral(aDate);
            return { sql: `${data.field} > ${aDateLiteral}`, values: [] };
          } else if (fieldDataType === "datetime") {
            const aDate = new Date(filter);
            const aDateLiteral = SfDate.toDateTimeLiteral(aDate);
            return { sql: `${data.field} > ${aDateLiteral}`, values: [] };
          } else {
            return { sql: `${data.field} > ${filter}`, values: [] };
          }
          break;
        case "beginsWith":
          // valid for text
          return { sql: `${data.field} LIKE '${filter}%'`, values: [] };
          break;
        case "notBeginsWith":
          // valid for text
          return { sql: `NOT ${data.field} LIKE '${filter}%'`, values: [] };
          break;
        case "endsWith":
          // valid for text
          return { sql: `${data.field} LIKE '%${filter}'`, values: [] };
          break;
        case "notEndsWith":
          // valid for text
          return {
            sql: `NOT ${data.field} LIKE '%${filter}'`,
            values: [filter],
          };
          break;
        case "between":
          // for date and number fields
          if (fieldDataType === "date") {
            const startDate = new Date(filter.start);
            const startDateLiteral = SfDate.toDateLiteral(startDate);
            const endDate = new Date(filter.end);
            const endDateLiteral = SfDate.toDateLiteral(endDate);
            return {
              sql: `${data.field} >= ${startDateLiteral} AND ${data.field} <= ${endDateLiteral}`,
              values: [],
            };
          } else if (fieldDataType === "datetime") {
            const startDate = new Date(filter.start);
            const startDateLiteral = SfDate.toDateTimeLiteral(startDate);
            const endDate = new Date(filter.end);
            const endDateLiteral = SfDate.toDateTimeLiteral(endDate);
            return {
              sql: `${data.field} >= ${startDateLiteral} AND ${data.field} <= ${endDateLiteral}`,
              values: [],
            };
          } else {
            return {
              sql: `${data.field} >= ${filter.start} AND ${data.field} <= ${filter.end}`,
              values: [],
            };
          }
          break;
        case "notBetween":
          // for date and number fields
          if (fieldDataType === "date") {
            const startDate = new Date(filter.start);
            const startDateLiteral = SfDate.toDateLiteral(startDate);
            const endDate = new Date(filter.end);
            const endDateLiteral = SfDate.toDateLiteral(endDate);
            return {
              sql: `${data.field} < ${startDateLiteral} OR ${data.field} > ${endDateLiteral}`,
              values: [],
            };
            break;
          } else if (fieldDataType === "datetime") {
            const startDate = new Date(filter.start);
            const startDateLiteral = SfDate.toDateTimeLiteral(startDate);
            const endDate = new Date(filter.end);
            const endDateLiteral = SfDate.toDateTimeLiteral(endDate);
            return {
              sql: `${data.field} < ${startDateLiteral} OR ${data.field} > ${endDateLiteral}`,
              values: [],
            };
            break;
          } else {
            return {
              sql: `${data.field} < ${filter.start} OR ${data.field} > ${filter.end}`,
              values: [],
            };
          }
          break;
      }
    }

    let sql = [];
    let values = [];

    for (let i = 0; i < data.rules.length; i++) {
      const subSQL = getSQL(data.rules[i], objFields, objName);
      console.log(subSQL);

      subSQL.sql = `( ${subSQL.sql} )`;
      sql.push(subSQL.sql);
    }

    // puts the AND/OR operator between the clauses
    if (data.rules.length > 1 && sql.length > 1) {
      sql = sql.join(` ${data.glue.toUpperCase()} `);
    }

    // if (data.rules.length) sql = `( ${sql} )`;
    console.log(sql);
    return { sql, values };
  }

  fastify.post("/querySearch", async function (request, reply) {
    var conn = fastify.conn;
    var userInfo = fastify.userInfo;
    var io = fastify.io;

    // libraries for node http requests
    const superagent = fastify.superagent;
    var hostName = request.headers.host;

    const payload = request.body;
    const objName = payload.objName;
    const relatedObjName = payload.relatedObjName;
    const relationName = payload.relationName;

    // for child grid queries
    const parentObjName = payload.parentObjName;
    const parentRecordId = payload.parentRecordId;
    let childLookupField = payload.lookupField;

    // for queryBuilder queries
    const searchString = payload.searchString;

    // populated when we want to return data to the grid, null otherwise
    const socketId = payload.socketId;

    let relatedQueryClause = null;
    let lookupField = null;

    const gridId = payload.gridId;

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
      }

      let objMetadataFields = objMetadata.fields;

      // get related object metadata if needed
      let relatedObjMetadata = null;
      if (relatedObjName) {
        relatedObjMetadata = metadataMap.get(relatedObjName);
        if (relatedObjMetadata === undefined) {
          let result = await getObjectMetadata(
            conn,
            relatedObjName,
            userInfo,
            metadataMap,
            superagent,
            hostName
          );

          if (result.status === "error") {
            throw new Error(result.errorMessage);
          }

          relatedObjMetadata = result.records;
        }
      }

      let relatedObjMetadataFields = [];

      if (relatedObjName && !relatedObjMetadata) {
        // get the metadata for this object
        // get the metadata for this object
        let result = await getObjectMetadata(
          conn,
          relatedObjName,
          userInfo,
          metadataMap,
          superagent,
          hostName
        );

        if (result.status !== "ok") {
          throw new Error(result.errorMessage);
        }
        relatedObjMetadata = result.response;
        relatedObjMetadataFields = relatedObjMetadata.fields;
      }

      // PROCESS THE MAIN OBJECT
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
          console.log(`Adding ${refField}`);
          fieldsArray.push(refField);
        }
      }

      // PROCESS THE RELATED OBJECT
      let relatedFieldsArray = [];
      for (let i = 0; i < relatedObjMetadataFields.length; i++) {
        const field = relatedObjMetadataFields[i];

        // returns the field
        // if reference field, returns relationship.Name if exists
        const referenceResult = await getReferenceFields(
          field,
          conn,
          relatedObjName,
          metadataMap,
          userInfo,
          superagent,
          hostName
        );

        if (referenceResult.status === "error") {
          console.log(`Error getting reference fields for ${field}`);
          throw new Error(referenceResult.errorMessage);
        }

        let referenceFieldsArray = referenceResult.records;

        // add fields to select clause
        for (let i = 0; i < referenceFieldsArray.length; i++) {
          const refField = referenceFieldsArray[i];
          relatedFieldsArray.push(refField);
        }
      }

      // convert fields array to comma-delimited string
      fields = fieldsArray.join();
      let finalFields = "";

      // create the child select clause
      if (relatedFieldsArray.length > 0) {
        // const relatedFields = relatedFieldsArray.join();
        // console.log(fields);

        let relatedFields = relatedFieldsArray.join();
        // console.log(relatedFields);

        let relatedClause = `, (Select ${relatedFields} From ${relationName})`;
        // console.log(relatedClause);

        fields += relatedClause;
        // console.log(fields);
      }

      let whereClause = null;
      let values = null;

      let done = false;

      var perChunk = 250;

      // CREATE THE WHERE CLAUSE FOR RELATED GRID QUERIES
      if (parentObjName !== null) {
        if (
          (parentObjName === "Account" || parentObjName === "Contact") &&
          objName === "Lead"
        ) {
          lookupField = childLookupField;
        } else if (objName === "Task" || objName === "Event") {
          lookupField = "WhatId";
        } else if (objName === parentObjName) {
          lookupField = `ParentId`;
        } else if (objName === "Attachment" || objName === "Note") {
          lookupField = "ParentId";
        } else {
          lookupField = `${parentObjName}Id`;
        }

        // relationship query
        relatedQueryClause = ` ${lookupField} = '${parentRecordId}'`;
      }

      // CREATE WHERE CLAUSE FROM QUERY CONDITIONS
      if (
        searchString !== null &&
        searchString !== undefined &&
        Object.keys(searchString).length > 0
      ) {
        // we have query conditions
        queryResult = getSQL(searchString, objMetadataFields, objName);

        whereClause = queryResult.sql;
        const firstWhereClause = whereClause;
        values = queryResult.values;

        // replace ? parameters with $1, $2, etc.
        var reg = /^[^?]*(\?)/;

        let newQuery = null;
        values.forEach((val, index) => {
          // var reg = /^-?\d+\.?\d*$/;
          // const match = reg.test(val);'
          var match = reg.test(whereClause);
          if (match) {
            newQuery = whereClause.replace("?", val);
            whereClause = newQuery;
          }
        });

        let batchingQuery = false;

        let recordsReturned = 0;

        // get the Ids
        const idQuery = `SELECT Id FROM ${objName} WHERE ${whereClause}`;

        // console.log(`Running Id query for ${objName}`);

        let idResults = await conn
          .query(idQuery)
          .execute({ autoFetch: true, maxFetch: 100000 });

        if (idResults.totalSize === 0) {
          // console.log(
          //   `Id query for ${objName} has ${idResults.records.length} records`
          // );
          io.to(socketId).emit("loadGridData", [], gridId, true);
          return [];
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

        const queryParams = searchString;

        let batchCounter = 0;
        let numBatches = idArray.length;
        let recordsReceived = 0;

        // SOLUTION USING ASYNC PROMISES

        // create the array of PROMISES
        const promises = idArray.map((batch) =>
          processBatch(
            batch,
            objName,
            fields,
            whereClause,
            relatedQueryClause,
            conn
          )
        );

        for (const batchPromise of promises) {
          batchCounter += 1;
          const batchResult = await batchPromise;
          queryRecords.push(batchResult.records);
          console.log(
            `Emitting ${batchResult.records.length} records to client with socket ${socketId}`
          );
          if (socketId !== null) {
            // send data to grid
            if (batchCounter === numBatches) {
              io.to(socketId).emit(
                "loadGridData",
                batchResult.records,
                gridId,
                true
              );
            } else {
              io.to(socketId).emit(
                "loadGridData",
                batchResult.records,
                gridId,
                false
              );
            }
          }
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
        let idQuery = null;
        if (relatedQueryClause !== null) {
          idQuery = `SELECT Id FROM ${objName} WHERE ${relatedQueryClause}`;
        } else {
          idQuery = `SELECT Id FROM ${objName}`;
        }

        // console.log(`Running Id query for ${objName}`);

        let idResults = await conn
          .query(idQuery)
          .execute({ autoFetch: true, maxFetch: 100000 });

        if (idResults.totalSize === 0) {
          // console.log(
          //   `Id query for ${objName} has ${idResults.records.length} records`
          // );
          io.to(socketId).emit("loadGridData", [], gridId, true);
          return [];
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

        const queryParams = searchString;

        let batchCounter = 0;
        let numBatches = idArray.length;
        let recordsReceived = 0;

        // SOLUTION USING ASYNC PROMISES

        // create the array of PROMISES
        const promises = idArray.map((batch) =>
          processBatch(
            batch,
            objName,
            fields,
            whereClause,
            relatedQueryClause,
            conn
          )
        );

        for (const batchPromise of promises) {
          batchCounter += 1;
          const batchResult = await batchPromise;
          queryRecords.push(batchResult.records);
          console.log(
            `Emitting ${batchResult.records.length} records to client with socket ${socketId}`
          );
          if (socketId !== null) {
            // send data to grid
            if (batchCounter === numBatches) {
              io.to(socketId).emit(
                "loadGridData",
                batchResult.records,
                gridId,
                true
              );
            } else {
              io.to(socketId).emit(
                "loadGridData",
                batchResult.records,
                gridId,
                false
              );
            }
          }
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
