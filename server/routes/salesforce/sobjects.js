module.exports = async function (fastify, options, next) {
  fastify.post("/sobjects", async function (request, reply) {
    try {
      var conn = fastify.conn;

      const payload = request.body;
      const userProfile = payload.userInfo.profileName;

      // get the org metadata using describeGlobal
      let results = await conn.describeGlobal();

      const orgObjects = [];

      // get the org objects
      results.sobjects.forEach((el) => {
        if (
          el.customSetting === false &&
          el.queryable === true &&
          el.deletable === true &&
          el.searchable === true &&
          el.retrieveable === true &&
          el.deprecatedAndHidden == false &&
          el.updateable === true
        ) {
          orgObjects.push({ name: el.name, label: el.label });
        }
      });

      // console.log(`orgObject size before filtering is ${orgObjects.length}`);

      const filteredOrgObjects = [];

      // filter out objects we don't want the grid to see
      orgObjects.forEach((obj) => {
        const objName = obj.name;

        const includesMetaObject =
          objName.includes("AcceptedEventRelation") ||
          objName.includes("Access") ||
          objName.includes("AccountCleanInfo") ||
          objName.includes("Action") ||
          objName.includes("AdditionalNumber") ||
          objName.includes("Announcement") ||
          objName.includes("Apex") ||
          objName.includes("Agent") ||
          objName.includes("AllInsightValue") ||
          objName.includes("Api") ||
          objName.includes("App") ||
          objName.includes("Async") ||
          objName.includes("Aura") ||
          objName.includes("Auth") ||
          objName.includes("Background") ||
          objName.includes("Branding") ||
          objName.includes("Browser") ||
          objName.includes("BusinessHours") ||
          objName.includes("BusinessProcess") ||
          objName.includes("Calendar") ||
          objName.includes("CallCenter") ||
          objName.includes("CampaignMemberStatus") ||
          objName.includes("CardPaymentMethod") ||
          objName.includes("Category") ||
          objName.includes("Channel") ||
          objName.includes("Chatter") ||
          objName.includes("Clean") ||
          objName.includes("Collaboration") ||
          objName.includes("Comm") ||
          objName.includes("Component") ||
          objName.includes("Conference") ||
          objName.includes("Config") ||
          objName.includes("Consumption") ||
          objName.includes("Consent") ||
          objName.includes("Content") ||
          objName.includes("Conversation") ||
          objName.includes("Cors") ||
          objName.includes("Credential") ||
          objName.includes("Cron") ||
          objName.includes("CspTrustedSite") ||
          objName.includes("Custom") ||
          objName.includes("DandBCompany") ||
          objName.includes("Dashboard") ||
          objName.includes("Data") ||
          objName.includes("Definition") ||
          objName.includes("Digital") ||
          objName.includes("Document") ||
          objName.includes("Domain") ||
          objName.includes("Duplicate") ||
          objName.includes("Email") ||
          objName.includes("Embedded") ||
          objName.includes("Engagement") ||
          objName.includes("Enhanced") ||
          objName.includes("Entity") ||
          objName.includes("EntitlementContact") ||
          // objName.includes("Event") ||
          objName.includes("External") ||
          objName.includes("Feed") ||
          objName.includes("File") ||
          objName.includes("Filter") ||
          objName.includes("Fiscal") ||
          objName.includes("Flow") ||
          objName.includes("Folder") ||
          objName.includes("Formula") ||
          objName.includes("Gateway") ||
          objName.includes("Goal") ||
          objName.includes("History") ||
          objName.includes("Image") ||
          objName.includes("Holiday") ||
          objName.includes("Idea") ||
          objName.includes("Junction") ||
          objName.includes("Knowledge") ||
          objName.includes("Language") ||
          objName.includes("Layout") ||
          objName.includes("License") ||
          objName.includes("Lightning") ||
          objName.includes("Link") ||
          objName.includes("Location") ||
          objName.includes("Log") ||
          objName.includes("Macro") ||
          objName.includes("Matching") ||
          objName.includes("Metrics") ||
          objName.includes("Messaging") ||
          objName.includes("Milestone") ||
          objName.includes("Memo") ||
          objName.includes("Notification") ||
          objName.includes("OAuth") ||
          objName.includes("OperatingHours") ||
          objName.includes("Option") ||
          objName.includes("Org") ||
          objName.includes("Page") ||
          objName.includes("Partner") ||
          objName.includes("Period") ||
          objName.includes("Permission") ||
          objName.includes("Picklist") ||
          objName.includes("Platform") ||
          objName.includes("Process") ||
          objName.includes("Prompt") ||
          objName.includes("Provider") ||
          objName.includes("Queue") ||
          objName.includes("Record") ||
          objName.includes("Recyle") ||
          objName.includes("Redirect") ||
          objName.includes("Registry") ||
          objName.includes("Report") ||
          objName.includes("Request") ||
          objName.includes("Resource") ||
          objName.includes("Rule") ||
          objName.includes("Scontrol") ||
          objName.includes("Scratch") ||
          objName.includes("Secure") ||
          objName.includes("Security") ||
          objName.includes("Session") ||
          objName.includes("Setup") ||
          objName.includes("Share") ||
          objName.includes("Site") ||
          objName.includes("Snapshot") ||
          objName.includes("Solution") ||
          objName.includes("Stamp") ||
          objName.includes("Status") ||
          objName.includes("Target") ||
          objName.includes("Template") ||
          objName.includes("Test") ||
          objName.includes("Text") ||
          objName.includes("Token") ||
          objName.includes("Topic") ||
          objName.includes("Transaction") ||
          objName.includes("Translation") ||
          objName.includes("Trigger") ||
          objName.includes("Type") ||
          objName.includes("Url") ||
          objName.includes("View") ||
          objName.includes("Wave") ||
          objName.includes("Weblink") ||
          objName.includes("__mdt");

        const standardObject = objName.substring(objName.length - 3) !== "__c";

        // console.log(
        //   `objName: ${objName}, includesMetaObject: ${includesMetaObject}, standardObject: ${standardObject}`
        // );

        /* eslint-disable */
        if (!includesMetaObject) {
          filteredOrgObjects.push(obj);
        }
      });

      // console.log(
      //   `orgObject size after filtering is ${filteredOrgObjects.length}`
      // );

      // get the users object permissions
      let perms = await conn.query(`
         SELECT
             SobjectType,
             PermissionsCreate,
             PermissionsRead,
             PermissionsEdit,
             PermissionsDelete,
             PermissionsModifyAllRecords,
             PermissionsViewAllRecords
         FROM ObjectPermissions
         WHERE ParentId IN ( SELECT Id
                   FROM permissionset
                   WHERE PermissionSet.Profile.Name = '${userProfile}')
         ORDER By SobjectType`);

      let objPermissions = perms.records;

      // store object permiossions in map
      let objPermMap = new Map();
      objPermissions.forEach((el) => {
        const perm = {
          Read: el.PermissionsRead,
          Create: el.PermissionsCreate,
          Edit: el.PermissionsEdit,
          Delete: el.PermissionsDelete,
          ViewAll: el.PermissionsViewAllRecords,
          ModifyAll: el.PermissionsModifyAllRecords,
        };
        // objectPermissionsMap is a global variable
        objPermMap.set(el.SobjectType, perm);
      });

      objectPermissionsMap = objPermMap;

      let objList = [];
      filteredOrgObjects.forEach((el) => {
        if (el.name === "Event") {
          const a = 1;
        }
        // if the user has read permission, add it to the list of user objects
        const aPerm = objPermMap.get(el.name);
        if (
          (aPerm && aPerm.Read === true) ||
          el.name === "Task" ||
          el.name === "Event" ||
          el.name === "Attachment" ||
          el.name === "Note"
        ) {
          const newObj = {
            id: el.name,
            value: el.label,
          };
          objList.push(newObj);
        }
      });

      // console.log("Num of SObjects : " + objList.length);
      // console.log(objList);
      return {
        status: "ok",
        errorMessage: null,
        data: objList,
      };
    } catch (err) {
      return {
        status: "error",
        errorMessage: err.message,
        data: [],
      };
    }
  });

  next();
};
