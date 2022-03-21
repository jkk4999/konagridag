module.exports = async function (fastify, options, next) {
   fastify.post("/sobjectPageLayouts", async function (request, reply) {
      try {
        var conn = fastify.conn;
  
        const payload = request.body;
        let objName = payload.sobject;
        const profileName = payload.profileName;
        const profileId = payload.profileId;
  
        // get the object metadata using describeGlobal
        let metaData = await conn.sobject(objName).describe();
  
        // get the object page layout fields in case
        // the user has not defined a template
        let pageLayoutFields = [];
  
        let layoutName = `${objName} Layout`;
        // let layouts = await conn.tooling.sobject("Layout").describe(objName);
        let layouts = await conn.tooling
          .sobject("Layout")
          .find({
            TableEnumOrId: objName,
            LayoutType: "standard",
            // Name: { $like: "Sales" },
            Name: layoutName,
          })
          .limit(1);
  
        if (layouts.length > 0) {
          const layoutMetadata = layouts[0];
          const layoutSections = layoutMetadata.Metadata.layoutSections;
          const layoutSection = layoutSections.find(
            (l) => l.label === `${objName} Information`
          );
  
          if (layoutSection !== undefined) {
            // get the fields from the page layout
            layoutSection.layoutColumns.forEach((col) => {
              const items = col.layoutItems;
              items.forEach((item) => {
                if (item.field !== null) {
                  pageLayoutFields.push(item.field);
                }
              });
            });
  
            const a = 1;
          } else {
            // get the fields from the object
            metaData.fields.forEach((f) => {
              pageLayoutFields.push(f.name);
            });
          }
        }
  
        const result = {
          pageLayoutFields: pageLayoutFields,
        };
  
        // add the page layout fields to the metadataMap
  
        const metadataMap = fastify.metadataMap;
        const objMetadata = metadataMap.get(objName);
        objMetadata.pageLayoutFields = pageLayoutFields;
  
        return result;
      } catch (err) {
        fastify.log.error(err);
        throw new Error(`API error retrieving page layout fields for ${objName}`);
      }
    });

  next();
}
