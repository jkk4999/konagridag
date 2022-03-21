module.exports = async function (fastify, options, next) {
  fastify.post("/sobjectFieldsDescribe", async function (request, reply) {
    try {
      var conn = fastify.conn;

      const payload = request.body;
      let objName = payload.sobject;
      console.log(`object name = ${objName}`);
      const profileName = payload.profileName;
      const profileId = payload.profileId;

      if (objName === undefined) return;

      // check if objName is object
      if (typeof objName === "object" && objName.constructor === Object) {
        objName = objName.id;
      }

      // let globalMeta = await conn.describeGlobal();

      // get the object metadata using describeGlobal
      let metaData = await conn.sobject(objName).describe();

      const objectProperties = {
        custom: metaData.custom,
        customSetting: metaData.customSetting,
        deletable: metaData.deletable,
        label: metaData.label,
        labelPlural: metaData.labelPlural,
        retrievable: metaData.retrievable,
        queryable: metaData.queryable,
        searchable: metaData.searchable,
        createable: metaData.createable,
        updateable: metaData.updateable,
        fields: metaData.fields,
        namedLayoutInfos: metaData.namedLayoutInfos,
      };

      // get the fields for the selected object
      // if picklist, store the values

      const data1 = metaData.fields;

      data1.sort((a, b) => {
        let val1 = a.name;
        let val2 = b.name;
        return val1.localeCompare(val2);
      });

      const fields = [];
      const requiredFields = [];

      data1.forEach((el) => {
        // check if the field is required
        if (!el.nillable) {
          requiredFields.push(el);
        }

        const field = {
          aggregatable: el.aggregatable,
          createable: el.createable,
          calculated: el.calculated,
          dataType: el.type,
          defaultValue: el.defaultValue,
          dependentPicklist: el.dependentPicklist,
          filterable: el.filterable,
          groupable: el.groupable,
          label: el.label,
          name: el.name,
          nillable: el.nillable,
          permissionable: el.permissionable,
          picklistValues: el.picklistValues,
          permissions: [],
          referenceTo: el.referenceTo,
          sortable: el.sortable,
          type: el.type,
          updateable: el.updateable,
        };

        fields.push(field);
      });

      requiredFields.sort((a, b) => {
        let val1 = a.name;
        let val2 = b.name;
        return val1.localeCompare(val2);
      });

      fields.sort((a, b) => {
        let val1 = a.name;
        let val2 = b.name;
        return val1.localeCompare(val2);
      });

      // filter out any fields which the user doesn't have permission for
      let perms = await conn.query(`
        SELECT Id, ParentId, Field, SobjectType, PermissionsRead, PermissionsEdit, Parent.ProfileId
        FROM FieldPermissions
        WHERE SobjectType = '${objName}'  AND ParentId IN (Select Id FROM PermissionSet where
        PermissionSet.Profile.Name = '${profileName}')`);

      const numPerms = perms.records.length;

      let permissionsMap = new Map();

      const permRecords = perms.records;

      permRecords.sort((a, b) => {
        let val1 = a.Field;
        let val2 = b.Field;
        return val1.localeCompare(val2);
      });

      permRecords.forEach((el) => {
        // strip out the sObject prefix from the Field name
        const nameMinusSobjectPrefix = el.Field.replace(
          el.SobjectType + ".",
          ""
        );

        // only store those field permissions where the user has read access
        if (el.PermissionsRead) {
          permissionsMap.set(nameMinusSobjectPrefix, {
            read: el.PermissionsRead,
            edit: el.PermissionsEdit,
          });
        }
      });

      let filteredFields = fields;

      // system fields are not returned in the fields metadata, so add them'=
      /*
        THIS CODE DOE NOT WORK BECUASE THE PERMISSIONS MAP DOES NOT have
        VALUES FOR ALL FIELDS
  
        let filteredFields = fields.filter((el) => {
          if (el.name === "Active__c") {
            console.log(`read to test ${el.name} filtered fields`);
          }
  
          if (
            permissionsMap.has(el.name) ||
            el.type === "id" ||
            el.name === "Name" ||
            el.type === "Record Type" ||
            el.name === "CreatedById" ||
            el.name === "CreatedDate" ||
            el.name === "LastModifiedById" ||
            el.name === "LastModifiedDate" ||
            el.name === "SystemModstamp"
          ) {
            return true;
          }
        });
  
        filteredFields.sort((a, b) => {
          val1 = a.name;
          val2 = b.name;
          return val1.localeCompare(val2);
        });
  
        */

      // get the record types for the selected object
      const data2 = metaData.recordTypeInfos;

      const recordTypes = [];

      data2.forEach((el) => {
        const recordType = {
          active: el.recordType,
          master: el.master,
          name: el.name,
          recordTypeId: el.recordTypeId,
        };

        recordTypes.push(recordType);
      });

      recordTypes.sort((a, b) => {
        let val1 = a.name;
        let val2 = b.name;
        return val1.localeCompare(val2);
      });

      // get the child relationships for the selected object
      const data3 = metaData.childRelationships;

      const childRelationships = [];

      data3.forEach((el) => {
        const relationship = {
          field: el.field,
          relationshipName: el.relationshipName,
          cascadeDelete: el.cascadeDelete,
        };

        childRelationships.push(relationship);
      });

      childRelationships.sort((a, b) => {
        val1 = a.field;
        val2 = b.field;
        return val1.localeCompare(val2);
      });

      // put the permissions into an array of object permissions
      const fieldPermissions = [];
      permissionsMap.forEach((value, key) => {
        const perm = {
          permissionsRead: value.read,
          permissionsEdit: value.edit,
        };
        fieldPermissions.push(key, perm);
      });

      const result = {
        childRelationships: childRelationships,
        fieldPermissions: fieldPermissions,
        fields: filteredFields,
        objectProperties: objectProperties,
        recordTypes: recordTypes,
        requiredFields: requiredFields,
      };

      const metadataMap = fastify.metadataMap;
      metadataMap.set(objName, result);

      return {
        status: "ok",
        errorMessage: null,
        records: result,
      };
    } catch (err) {
      return {
        status: "error",
        errorMessage: `API error retrieving metadata for ${objName}`,
        records: [],
      };
    }
  });

  next();
}


