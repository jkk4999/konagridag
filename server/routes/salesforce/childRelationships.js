module.exports = async function (fastify, options, next) {
  fastify.post("/childRelationships", async function (request, reply) {
    const payload = request.body;
    const objName = payload.sobject;
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
          !el.includes("Agent") &&
          !el.includes("Analytics") &&
          !el.includes("And") &&
          !el.includes("Apex") &&
          !el.includes("Aura") &&
          !el.includes("Auth") &&
          !el.includes("Assignment") &&
          !el.includes("Background") &&
          !el.includes("Batch") &&
          !el.includes("Calculation") &&
          !el.includes("Call") &&
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
          !el.includes("Insight") &&
          !el.includes("License") &&
          !el.includes("Link") &&
          !el.includes("Location") &&
          !el.includes("Metric") &&
          !el.includes("Preference") &&
          !el.includes("Process") &&
          !el.includes("Scratch") &&
          !el.includes("Share") &&
          !el.includes("Session") &&
          !el.includes("Subscription") &&
          !el.includes("Snapshot") &&
          !el.includes("Tag") &&
          !el.includes("Transaction") &&
          !el.includes("Version") &&
          !el.includes("Wallet")
        ) {
          // console.log(`added ${el} to noDups`);
          noDups.push(el);
        }
      });

      let records = noDups.sort();
      return {
        status: "ok",
        errorMessage: null,
        records: records,
      };
    } catch (error) {
      fastify.log.error(error);
      return {
        status: "error",
        errorMessage: error.toString(),
        records: [],
      };
    }
  });

  next();
}

