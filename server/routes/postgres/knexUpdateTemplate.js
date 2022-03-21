module.exports = async function (fastify, options, next) {
  fastify.post("/knexUpdateTemplate", async function (request, reply) {
    // pg client
    // const client = fastify.client;

    const db = fastify.db;
    const pgp = fastify.pgp;

    // 1 template record per request sent
    const payload = request.body;

    // this is an array - required by pg-promise
    const templateToUpdate = payload.template;

    const template_fields = payload.templateFields;

    // true/false
    // used to update the manageTemplates view
    const skipFields = Object.keys(template_fields).length === 0;

    // UPDATING TEMPLATE RECORD
    try {
      console.log(templateToUpdate);

      // template columnSet
      const csTemplate = new pgp.helpers.ColumnSet(
        [
          "?id",
          // "orgid",
          "template_name",
          // "owner",
          // "is_active",
          "is_public",
          "description",
          "is_related",
          // "object",
        ],
        { table: "template" }
      );

      // update the template record(s)
      const update =
        pgp.helpers.update(templateToUpdate, csTemplate) +
        " WHERE v.id = t.id" +
        " RETURNING *";

      // execute update
      const updatedTemplate = await db.any(update);

      // INSERT/UPDATE/DELETE OF template_fields
      // skipFields === false when updating template fields
      let updatedFields = [];
      let insertedFields = [];
      let deletedFields = [];
      if (!skipFields) {
        // create a list of field records to insert
        let fieldInsertRecs = [];
        template_fields.forEach((el) => {
          if (el.id === null || el.id === 0) {
            fieldInsertRecs.push(el);
          }
        });

        // create a list of field records to update
        let fieldUpdateRecs = [];
        template_fields.forEach((el) => {
          if (el.id !== 0 && el.id !== null) {
            fieldUpdateRecs.push(el);
          }
        });

        // get the selectedFields from the database
        // so we can determine if we need to delete
        // any fields from the template
        // get the fields for this template

        let templateFields = await db.any(
          "SELECT * FROM template_field WHERE templateid = $1",
          [templateToUpdate[0].id]
        );

        const fieldIdsToDelete = [];

        // deleteFieldSet will hold the ids of field records to delete
        // initially, it holds the id of all template fields
        var deleteFieldIdSet = new Set();
        templateFields.forEach((el) => {
          deleteFieldIdSet.add(el.id);
        });

        // fieldUpdateRecs will be missing the deleted field
        // remove all fieldUpdateRecs from templateFields
        // the remaining templateFieldRec is what we want to delete
        fieldUpdateRecs.forEach((el) => {
          if (deleteFieldIdSet.has(el.id)) {
            // remove from fields to delete
            deleteFieldIdSet.delete(el.id);
          }
        });

        // whatever is left in the set are records to delete
        // store the ids to delete in an array
        deleteFieldIdSet.forEach((el) => {
          fieldIdsToDelete.push(el);
        });

        if (fieldIdsToDelete.length > 0) {
          deletedFields = await db.any(
            "DELETE FROM template_field WHERE id IN ($1:csv)" + "RETURNING id",
            [fieldIdsToDelete]
          );
        }

        if (fieldUpdateRecs.length > 0) {
          const csTemplateFieldUpdate = new pgp.helpers.ColumnSet(
            [
              "?id",
              "?templateid",
              "?name",
              "?datatype",
              "column_order",
              "sort",
              "filter",
              "group",
              "group_field",
              "aggregation",
              "split",
              "formula",
            ],
            { table: "template_field" }
          );
          updateFields =
            pgp.helpers.update(fieldUpdateRecs, csTemplateFieldUpdate) +
            " WHERE v.id = t.id" +
            " RETURNING *";

          updatedFields = await db.any(updateFields);
        }

        if (fieldInsertRecs.length > 0) {
          const csTemplateFieldInsert = new pgp.helpers.ColumnSet(
            [
              "templateid",
              "name",
              "datatype",
              "column_order",
              "sort",
              "filter",
              "group",
              "group_field",
              "aggregation",
              "split",
              "formula",
            ],
            { table: "template_field" }
          );
          const insertFields =
            pgp.helpers.insert(fieldInsertRecs, csTemplateFieldInsert) +
            "RETURNING *";

          // console.log(insertFields);

          // executing the query:
          insertedFields = await db.any(insertFields);
        }
      }
      // console.log("Inserted template fields >>");
      // console.log(JSON.stringify(insertedFields));
      // console.log("Updated template fields >>");
      // console.log(JSON.stringify(updatedFields));
      // console.log("Deleted template fields >>");
      // console.log(JSON.stringify(deletedFields));

      return updatedTemplate;
    } catch (error) {
      throw new Error(`Error updating templates - ${error.message}`);
    }
  });

  next();
}

