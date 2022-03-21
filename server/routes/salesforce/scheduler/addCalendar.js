module.exports = async function (fastify, options, next) {
  fastify.post("/addCalendar", async function (request, reply) {
    const payload = request.body;
    const orgid = payload.orgid;
    const userid = payload.userid;
    const objName = payload.objName

    var conn = fastify.conn;

    try {
      const response = await conn.describe(objName);

      const childRelationships = response.childRelationships;

      // store in array
      const relationships = [];
      childRelationships.forEach((r) => {
        relationships.push(r.childSObject);
        const a = 1;
      });

      relationships.sort();
      // remove duplicates
      // [...new Set(relationships)];
      const noDups = [];

      // filter out the relationships we don't want to show
      relationships.forEach((el, index) => {
        // console.log(`el: ${el}, index: ${index}`);
        if (
          noDups.indexOf(el) === -1 &&
          !el.includes("Action") &&
          !el.includes("Activity") &&
          !el.includes("And") &&
          !el.includes("Assignment") &&
          !el.includes("Change") &&
          !el.includes("Clean") &&
          !el.includes("Collaboration") &&
          !el.includes("Combined") &&
          !el.includes("Distribution") &&
          !el.includes("Document") &&
          !el.includes("Duplicate") &&
          !el.includes("Email") &&
          !el.includes("Entity") &&
          !el.includes("Feed") &&
          !el.includes("Flow") &&
          !el.includes("History") &&
          !el.includes("Link") &&
          !el.includes("Location") &&
          !el.includes("Preference") &&
          !el.includes("Process") &&
          !el.includes("Share") &&
          !el.includes("Session") &&
          !el.includes("Version")
        ) {
          // console.log(`added ${el} to noDups`);
          noDups.push(el);
        }
      });

      return noDups.sort();
    } catch (error) {
      fastify.log.error(error);
      return { error: error.toString() };
    }
  });

  next();
}
