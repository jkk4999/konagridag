module.exports = async function (fastify, options, next) {
  // contacts for account = key (AccountId), value (ContactIds[])
  let contactMap = new Map();

  async function createAccounts(
    conn,
    faker,
    numRecords,
    objMetadata,
    accounts
  ) {
    let hasRecordTypes = false;
    if (objMetadata.recordTypes.length > 1) {
      hasRecordTypes = true;
    }

    let recordTypeId = null;
    let randomNumber = 0;

    let records = [];

    let fields = objMetadata.fields;

    // always create account records
    for (let i = 0; i < numRecords; i++) {
      // Name
      var accntName = faker.company.companyName();

      let newRecord = {
        Name: accntName,
      };

      // RecordTypeId
      if (hasRecordTypes) {
        const recordTypes = objMetadata.recordTypes;
        const objRecordTypes = recordTypes.filter((rt) => rt.name !== "Master");

        // filter out master record type
        randomNumber = Math.floor(Math.random() * objRecordTypes.length);
        recordTypeId = objRecordTypes[randomNumber].recordTypeId;
        newRecord["RecordTypeId"] = recordTypeId;
      }

      // Industry
      const industryField = fields.find((f) => f.name === "Industry");
      const industries = industryField.picklistValues;
      if (industries.length > 0) {
        randomNumber = Math.floor(Math.random() * industries.length);
        const industry = industries[randomNumber].value;
        newRecord["Industry"] = industry;
      }

      // AccountSource
      const accountSourceField = fields.find((f) => f.name === "AccountSource");
      const sources = accountSourceField.picklistValues;
      if (sources.length > 0) {
        randomNumber = Math.floor(Math.random() * sources.length);
        const source = sources[randomNumber].value;
        newRecord["AccountSource"] = source;
      }

      // Type
      const typeField = fields.find((f) => f.name === "Type");
      const types = typeField.picklistValues;
      if (types.length > 0) {
        randomNumber = Math.floor(Math.random() * types.length);
        const type = types[randomNumber].value;
        newRecord["Type"] = type;
      }

      // Rating
      const ratingField = fields.find((f) => f.name === "Rating");
      const ratings = ratingField.picklistValues;
      if (ratings.length > 0) {
        randomNumber = Math.floor(Math.random() * ratings.length);
        const rating = ratings[randomNumber].value;
        newRecord["Rating"] = rating;
      }

      // Ownership
      const ownershipField = fields.find((f) => f.name === "Ownership");
      const ownershipTypes = ownershipField.picklistValues;
      if (ownershipTypes.length > 0) {
        randomNumber = Math.floor(Math.random() * ownershipTypes.length);
        const ownershipType = ownershipTypes[randomNumber].value;
        newRecord["Ownership"] = ownershipType;
      }

      // AnnualRevenue
      randomNumber = Math.floor(Math.random() * 10000000);
      newRecord["AnnualRevenue"] = randomNumber;

      // Employees
      randomNumber = Math.floor(Math.random() * 5000);
      newRecord["NumberOfEmployees"] = randomNumber;

      // AccountNumber
      randomNumber = Math.floor(Math.random() * 5000);
      newRecord["AccountNumber"] = randomNumber.toString();

      // Phone
      var accntPhone = faker.phone.phoneNumber();
      newRecord["Phone"] = accntPhone;

      // Fax
      var accntFax = faker.phone.phoneNumber();
      newRecord["Fax"] = accntPhone;

      // Website
      var accntWebsite = faker.internet.url();
      newRecord["Website"] = accntWebsite;

      // YearStarted
      const max = 2021;
      const min = 1950;
      randomNumber = Math.floor(Math.random() * (max - min) + min);
      newRecord["NumberOfEmployees"] = randomNumber.toString();

      // BillingAddress
      newRecord["BillingStreet"] = faker.address.streetAddress();
      newRecord["BillingCity"] = faker.address.city();
      newRecord["BillingState"] = faker.address.state();
      newRecord["BillingPostalCode"] = faker.address.zipCode();
      newRecord["BillingCountry"] = faker.address.country();
      newRecord["BillingLatitude"] = faker.address.latitude();
      newRecord["BillingLongitude"] = faker.address.longitude();

      // ShippingAddress
      newRecord["ShippingStreet"] = faker.address.streetAddress();
      newRecord["ShippingCity"] = faker.address.city();
      newRecord["ShippingState"] = faker.address.state();
      newRecord["ShippingPostalCode"] = faker.address.zipCode();
      newRecord["ShippingCountry"] = newRecord.BillingCountry;
      newRecord["ShippingLatitude"] = faker.address.latitude();
      newRecord["ShippingLongitude"] = faker.address.longitude();

      records.push(newRecord);
    }

    try {
      let response = await conn
        .sobject("Account")
        .create(records, { allowRecursive: true });

      const insertedRecIds = [];
      const errorRecs = [];
      response.forEach((res) => {
        if (res.success) {
          insertedRecIds.push(res.id);
        } else {
          const errRec = {
            id: res.id,
            error: res.error,
          };
          errorRecs.push(errRec);
        }
      });

      const result = {
        insertedRecIds: insertedRecIds,
        errors: errorRecs,
      };

      accounts = insertedRecIds;

      return result;
    } catch (error) {
      console.log("Errors creating demo Accounts");
      const result = {
        insertedRecIds: [],
        errors: error,
      };
      return result;
    }
  }

  async function createContacts(
    conn,
    faker,
    accountIds,
    objMetadata,
    contacts
  ) {
    let hasRecordTypes = false;
    if (objMetadata.recordTypes.length > 1) {
      hasRecordTypes = true;
    }

    let recordTypeId = null;
    let randomNumber = 0;

    let records = [];

    // create 2 contacts per account
    accountIds.forEach((accntId) => {
      for (let i = 0; i < 2; i++) {
        let newRecord = {};

        // RecordTypeId
        if (hasRecordTypes) {
          const recordTypes = objMetadata.recordTypes;
          const objRecordTypes = recordTypes.filter(
            (rt) => rt.name !== "Master"
          );

          // filter out master record type
          randomNumber = Math.floor(Math.random() * objRecordTypes.length);
          recordTypeId = objRecordTypes[randomNumber].recordTypeId;
          newRecord["RecordTypeId"] = recordTypeId;
        }

        newRecord["FirstName"] = faker.name.firstName();
        newRecord["LastName"] = faker.name.lastName();
        newRecord["Title"] = faker.name.title();
        newRecord["Email"] = faker.internet.email();
        newRecord["Phone"] = faker.phone.phoneNumber();
        newRecord["AccountId"] = accntId;

        records.push(newRecord);
      }
    });

    // store to database
    try {
      let response = await conn
        .sobject("Contact")
        .create(records, { allowRecursive: true });

      const insertedRecordIds = [];
      const errorRecs = [];
      response.forEach((res) => {
        if (res.success) {
          insertedRecordIds.push(res.id);
        } else {
          const errRec = {
            id: res.id,
            error: res.error,
          };
          errorRecs.push(errRec);
        }
      });

      const result = {
        insertedRecIds: insertedRecordIds,
        errors: errorRecs,
      };

      // get the contacts and create the contact map
      const accntContacts = await conn
        .query(`Select Id, Name, AccountId From Contact`)
        .execute({ autoFetch: true, maxFetch: 100000 });

      if (accntContacts.totalSize === 0) {
        // handel error
        return false;
      }

      accntContacts.records.forEach((rec) => {
        if (contactMap.has(rec.AccountId)) {
          // get the contact array
          const accntContacts = contactMap.get(rec.AccountId);
          // add to array
          if (!accntContacts.find((f) => f.id === rec.Id)) {
            accntContacts.push(rec.Id);
          }
        } else {
          // create the map entry
          contactMap.set(rec.AccountId, [rec.Id]);
        }
      });
      return result;
    } catch (error) {
      console.log("Errors creating demo Accounts");
      const result = {
        insertedRecIds: [],
        errors: error,
      };
      return result;
    }
  }

  async function createLeads(conn, faker, objMetadata, leads, users) {
    let fields = objMetadata.fields;

    let hasRecordTypes = false;
    if (objMetadata.recordTypes.length > 1) {
      hasRecordTypes = true;
    }

    let recordTypeId = null;
    let randomNumber = 0;

    let records = [];

    // create 100 Leads
    for (let i = 0; i < 2; i++) {
      let newRecord = {};

      // RecordTypeId
      if (hasRecordTypes) {
        const recordTypes = objMetadata.recordTypes;
        const objRecordTypes = recordTypes.filter((rt) => rt.name !== "Master");

        // filter out master record type
        randomNumber = Math.floor(Math.random() * objRecordTypes.length);
        recordTypeId = objRecordTypes[randomNumber].recordTypeId;
        newRecord["RecordTypeId"] = recordTypeId;
      }

      newRecord["FirstName"] = faker.name.firstName();
      newRecord["LastName"] = faker.name.lastName();
      newRecord["Title"] = faker.name.title();
      newRecord["Email"] = faker.internet.email();
      newRecord["Phone"] = faker.phone.phoneNumber();
      newRecord["Company"] = faker.company.companyName();

      randomNumber = Math.floor(Math.random() * users.length);
      newRecord["OwnerId"] = users[randomNumber];

      // AnnualRevenue
      randomNumber = Math.floor(Math.random() * 10000000);
      newRecord["AnnualRevenue"] = randomNumber;

      // No. of Employees
      randomNumber = Math.floor(Math.random() * 5000);
      newRecord["NumberOfEmployees"] = randomNumber;

      // Rating
      const ratingField = fields.find((f) => f.name === "Rating");
      const ratings = ratingField.picklistValues;
      if (ratings.length > 0) {
        randomNumber = Math.floor(Math.random() * ratings.length);
        const rating = ratings[randomNumber].value;
        newRecord["Rating"] = rating;
      }
      // Industry
      const industryField = fields.find((f) => f.name === "Industry");
      const industries = industryField.picklistValues;
      if (industries.length > 0) {
        randomNumber = Math.floor(Math.random() * industries.length);
        const industry = industries[randomNumber].value;
        newRecord["Industry"] = industry;
      }

      // LeadSource
      const leadSourceField = fields.find((f) => f.name === "LeadSource");
      const leadSources = leadSourceField.picklistValues;
      if (leadSources.length > 0) {
        randomNumber = Math.floor(Math.random() * leadSources.length);
        const source = leadSources[randomNumber].value;
        newRecord["LeadSource"] = source;
      }

      // LeadStatus
      const leadStatusField = fields.find((f) => f.name === "Status");
      const statuses = leadStatusField.picklistValues;
      if (statuses.length > 0) {
        randomNumber = Math.floor(Math.random() * statuses.length);
        const status = statuses[randomNumber].value;
        newRecord["Status"] = status;
      }

      records.push(newRecord);
    }

    // store to database
    try {
      let response = await conn
        .sobject("Lead")
        .create(records, { allowRecursive: true });

      const insertedRecordIds = [];
      const errorRecs = [];
      response.forEach((res) => {
        if (res.success) {
          insertedRecordIds.push(res.id);
        } else {
          const errRec = {
            id: res.id,
            error: res.error,
          };
          errorRecs.push(errRec);
        }
      });

      const result = {
        insertedRecIds: insertedRecordIds,
        errors: errorRecs,
      };

      return result;
    } catch (error) {
      console.log("Errors creating demo Leads");
      const result = {
        insertedRecIds: [],
        errors: error,
      };
      return result;
    }
  }

  async function getUsers(conn, users) {
    let returnResult = {};

    try {
      let results = await conn
        .query("Select Id, Name From User")
        .execute({ autoFetch: true, maxFetch: 100000 });

      if (results.totalSize === 0) {
        // handel error
        throw new Error("No users found");
      }

      let userIds = [];

      results.records.forEach((rec) => {
        if (
          !rec.Name.includes("Automated") &&
          !rec.Name.includes("Data.com") &&
          !rec.Name.includes("Integration") &&
          !rec.Name.includes("Security") &&
          !rec.Name.includes("Platform") &&
          !rec.Name.includes("Chatter")
        )
          userIds.push(rec.Id);
      });

      returnResult = {
        status: "ok",
        records: userIds,
      };
    } catch (error) {
      returnResult = {
        status: "error",
        errorMessage: "No users found",
      };
    }

    return returnResult;
  }

  async function createTasks(
    conn,
    faker,
    users,
    accountIds,
    objMetadata,
    tasks
  ) {
    let fields = objMetadata.fields;

    let hasRecordTypes = false;
    if (objMetadata.recordTypes.length > 1) {
      hasRecordTypes = true;
    }

    let recordTypeId = null;
    let randomNumber = 0;

    let records = [];

    // create 2 tasks per account
    accountIds.forEach((accntId) => {
      for (let i = 0; i < 2; i++) {
        let newRecord = {};

        // RecordTypeId
        if (hasRecordTypes) {
          const recordTypes = objMetadata.recordTypes;
          const objRecordTypes = recordTypes.filter(
            (rt) => rt.name !== "Master"
          );

          // filter out master record type
          randomNumber = Math.floor(Math.random() * objRecordTypes.length);
          recordTypeId = objRecordTypes[randomNumber].recordTypeId;
          newRecord["RecordTypeId"] = recordTypeId;
        }

        // Type field
        const typeField = fields.find((f) => f.name === "Type");
        const types = typeField.picklistValues;
        if (types.length > 0) {
          randomNumber = Math.floor(Math.random() * types.length);
          const atype = types[randomNumber].value;
          newRecord["Type"] = atype;
        }

        // Subject field
        const subjectField = fields.find((f) => f.name === "Subject");
        const subjects = subjectField.picklistValues;
        if (subjects.length > 0) {
          randomNumber = Math.floor(Math.random() * subjects.length);
          const asubject = subjects[randomNumber].value;
          newRecord["Subject"] = asubject;
        }

        // Status field
        const statusField = fields.find((f) => f.name === "Status");
        const statuses = statusField.picklistValues;
        if (statuses.length > 0) {
          randomNumber = Math.floor(Math.random() * statuses.length);
          const aStatus = statuses[randomNumber].value;
          newRecord["Status"] = aStatus;
        }

        // Priority field
        const priorityField = fields.find((f) => f.name === "Priority");
        const priorities = priorityField.picklistValues;
        if (priorities.length > 0) {
          randomNumber = Math.floor(Math.random() * priorities.length);
          const aPriority = priorities[randomNumber].value;
          newRecord["Priority"] = aPriority;
        }

        // DueDate field
        const activityField = fields.find((f) => f.name === "ActivityDate");
        const today = new Date();
        // add random number of days to today
        const numDays = Math.floor(Math.random() * 30);
        today.setDate(today.getDate() + numDays);
        newRecord["ActivityDate"] = today;

        // Related To
        newRecord["WhatId"] = accntId;

        randomNumber = Math.floor(Math.random() * users.length);
        newRecord["OwnerId"] = users[randomNumber];

        // Name (contact)
        const accountContacts = contactMap.get(accntId);
        randomNumber = Math.floor(Math.random() * accountContacts.length);
        newRecord["WhoId"] = accountContacts[randomNumber];

        records.push(newRecord);
      }
    });

    // store to database
    try {
      let response = await conn
        .sobject("Task")
        .create(records, { allowRecursive: true });

      const insertedRecordIds = [];
      const errorRecs = [];
      response.forEach((res) => {
        if (res.success) {
          insertedRecordIds.push(res.id);
        } else {
          const errRec = {
            id: res.id,
            error: res.error,
          };
          errorRecs.push(errRec);
        }
      });

      const result = {
        insertedRecIds: insertedRecordIds,
        errors: errorRecs,
      };

      return result;
    } catch (error) {
      console.log("Errors creating demo Tasks");
      const result = {
        insertedRecIds: [],
        errors: error,
      };
      return result;
    }
  }

  async function createEvents(
    conn,
    faker,
    users,
    accountIds,
    objMetadata,
    events
  ) {
    let fields = objMetadata.fields;

    let hasRecordTypes = false;
    if (objMetadata.recordTypes.length > 1) {
      hasRecordTypes = true;
    }

    let recordTypeId = null;
    let randomNumber = 0;

    let records = [];

    // create 2 events per account
    accountIds.forEach((accntId) => {
      for (let i = 0; i < 2; i++) {
        let newRecord = {};

        // RecordTypeId
        if (hasRecordTypes) {
          const recordTypes = objMetadata.recordTypes;
          const objRecordTypes = recordTypes.filter(
            (rt) => rt.name !== "Master"
          );

          // filter out master record type
          randomNumber = Math.floor(Math.random() * objRecordTypes.length);
          recordTypeId = objRecordTypes[randomNumber].recordTypeId;
          newRecord["RecordTypeId"] = recordTypeId;
        }

        // Type field
        const typeField = fields.find((f) => f.name === "Type");
        const types = typeField.picklistValues;
        if (types.length > 0) {
          randomNumber = Math.floor(Math.random() * types.length);
          const atype = types[randomNumber].value;
          newRecord["Type"] = atype;
        }

        // Subject field
        const subjectField = fields.find((f) => f.name === "Subject");
        const subjects = subjectField.picklistValues;
        if (subjects.length > 0) {
          randomNumber = Math.floor(Math.random() * subjects.length);
          const asubject = subjects[randomNumber].value;
          newRecord["Subject"] = asubject;
        }

        // StartDateTime field
        let today = new Date();
        const numDays = Math.floor(Math.random() * 45);
        today.setDate(today.getDate() + numDays);

        // add random hours between 8am and 6pm
        const hours = Math.floor(Math.random() * (16 - 8 + 1) + 8);
        today.setHours(hours);
        newRecord["StartDateTime"] = today;

        // EndDateTime field
        let endDateTime = new Date(today);
        endDateTime.setHours(endDateTime.getHours() + 1);
        newRecord["EndDateTime"] = endDateTime;

        // Related To
        newRecord["WhatId"] = accntId;

        // OwnerId
        randomNumber = Math.floor(Math.random() * users.length);
        const userId = users[randomNumber];
        newRecord["OwnerId"] = userId;

        // Name (contact)
        const accountContacts = contactMap.get(accntId);
        randomNumber = Math.floor(Math.random() * accountContacts.length);
        newRecord["WhoId"] = accountContacts[randomNumber];

        records.push(newRecord);
      }
    });

    // store to database
    try {
      let response = await conn
        .sobject("Event")
        .create(records, { allowRecursive: true });

      const insertedRecordIds = [];
      const errorRecs = [];
      response.forEach((res) => {
        if (res.success) {
          insertedRecordIds.push(res.id);
        } else {
          errorRecs.push(...res.errors);
        }
      });

      if (errorRecs.length > 0) {
        const errorResponse = {
          status: "error",
          records: errorRecs,
        };

        throw new error(errorResponse);
      }

      const result = {
        status: "ok",
        records: insertedRecordIds,
      };

      return result;
    } catch (error) {
      return error.errorResponse;
    }
  }

  async function createCases(
    conn,
    faker,
    users,
    accountIds,
    objMetadata,
    cases
  ) {
    let fields = objMetadata.fields;

    let hasRecordTypes = false;
    if (objMetadata.recordTypes.length > 1) {
      hasRecordTypes = true;
    }

    let recordTypeId = null;
    let randomNumber = 0;

    let records = [];

    // create 2 cases per account
    accountIds.forEach((accntId) => {
      for (let i = 0; i < 2; i++) {
        let newRecord = {};

        // RecordTypeId
        if (hasRecordTypes) {
          const recordTypes = objMetadata.recordTypes;
          const objRecordTypes = recordTypes.filter(
            (rt) => rt.name !== "Master"
          );

          // filter out master record type
          randomNumber = Math.floor(Math.random() * objRecordTypes.length);
          recordTypeId = objRecordTypes[randomNumber].recordTypeId;
          newRecord["RecordTypeId"] = recordTypeId;
        }

        // Type field
        const typeField = fields.find((f) => f.name === "Type");
        const types = typeField.picklistValues;
        if (types.length > 0) {
          randomNumber = Math.floor(Math.random() * types.length);
          const atype = types[randomNumber].value;
          newRecord["Type"] = atype;
        }

        // Subject field
        const subjectField = fields.find((f) => f.name === "Subject");
        const subjects = subjectField.picklistValues;
        if (subjects.length > 0) {
          randomNumber = Math.floor(Math.random() * subjects.length);
          const asubject = subjects[randomNumber].value;
          newRecord["Subject"] = asubject;
        }

        // Status field
        const statusField = fields.find((f) => f.name === "Status");
        const statuses = statusField.picklistValues;
        if (statuses.length > 0) {
          randomNumber = Math.floor(Math.random() * statuses.length);
          const aStatus = statuses[randomNumber].value;
          newRecord["Status"] = aStatus;
        }

        // Priority field
        const priorityField = fields.find((f) => f.name === "Priority");
        const priorities = priorityField.picklistValues;
        if (priorities.length > 0) {
          randomNumber = Math.floor(Math.random() * priorities.length);
          const aPriority = priorities[randomNumber].value;
          newRecord["Priority"] = aPriority;
        }

        // Origin field
        const originField = fields.find((f) => f.name === "Origin");
        const origins = originField.picklistValues;
        if (origins.length > 0) {
          randomNumber = Math.floor(Math.random() * origins.length);
          const anOrigin = origins[randomNumber].value;
          newRecord["Origin"] = anOrigin;
        }

        // DueDate field
        // const activityField = fields.find((f) => f.name === "ActivityDate");
        // const today = new Date();
        // // add random number of days to today
        // const numDays = Math.floor(Math.random() * 30);
        // today.setDate(today.getDate() + numDays);
        // newRecord["ActivityDate"] = today;

        // Related To Account
        newRecord["AccountId"] = accntId;

        // Case Owner
        randomNumber = Math.floor(Math.random() * users.length);
        newRecord["OwnerId"] = users[randomNumber];

        // Contact Name
        const accountContacts = contactMap.get(accntId);
        randomNumber = Math.floor(Math.random() * accountContacts.length);
        newRecord["ContactId"] = accountContacts[randomNumber];

        // Description
        const desc = faker.lorem.sentence();
        newRecord["Description"] = desc;
        records.push(newRecord);
      }
    });

    // store to database
    try {
      let response = await conn
        .sobject("Case")
        .create(records, { allowRecursive: true });

      const insertedRecordIds = [];
      const errorRecs = [];
      response.forEach((res) => {
        if (res.success) {
          insertedRecordIds.push(res.id);
        } else {
          const errRec = {
            id: res.id,
            error: res.error,
          };
          errorRecs.push(errRec);
        }
      });

      const result = {
        insertedRecIds: insertedRecordIds,
        errors: errorRecs,
      };

      return result;
    } catch (error) {
      console.log("Errors creating demo Cases");
      const result = {
        insertedRecIds: [],
        errors: error,
      };
      return result;
    }
  }

  async function createOpportunities(
    conn,
    faker,
    users,
    accountIds,
    accountMap,
    objMetadata,
    opportunities
  ) {
    let fields = objMetadata.fields;

    let hasRecordTypes = false;
    if (objMetadata.recordTypes.length > 1) {
      hasRecordTypes = true;
    }

    let recordTypeId = null;
    let randomNumber = 0;

    let records = [];

    // create 2 Opportunities per account
    accountIds.forEach((accntId) => {
      for (let i = 0; i < 2; i++) {
        let newRecord = {};

        // RecordTypeId
        if (objMetadata.recordTypes.length > 0) {
          const recordTypes = objMetadata.recordTypes;

          // filter out master record type
          randomNumber = Math.floor(Math.random() * recordTypes.length);
          if ((recordTypes.length = 1)) {
            newRecord["RecordTypeId"] = recordTypes[0].Id;
          } else {
            randomNumber = Math.floor(Math.random() * recordTypes.length);
            newRecord["RecordTypeId"] = recordTypes[randomNumber].Id;
          }
        }

        // Type field
        const typeField = fields.find((f) => f.name === "Type");
        const types = typeField.picklistValues;
        if (types.length > 0) {
          randomNumber = Math.floor(Math.random() * types.length);
          const atype = types[randomNumber].value;
          newRecord["Type"] = atype;
        }

        // Stage field
        const stageField = fields.find((f) => f.name === "StageName");
        const stages = stageField.picklistValues;
        if (stages.length > 0) {
          randomNumber = Math.floor(Math.random() * stages.length);
          const aStage = stages[randomNumber].value;
          newRecord["StageName"] = aStage;
        }

        // ForecastCategoryName field
        const forecastCategoryField = fields.find(
          (f) => f.name === "ForecastCategoryName"
        );
        const categories = forecastCategoryField.picklistValues;
        if (categories.length > 0) {
          randomNumber = Math.floor(Math.random() * categories.length);
          const aForecastCategory = categories[randomNumber].value;
          newRecord["ForecastCategoryName"] = aForecastCategory;
        }

        // Lead Source field
        const leadSourceField = fields.find((f) => f.name === "LeadSource");
        const leadSources = leadSourceField.picklistValues;
        if (leadSources.length > 0) {
          randomNumber = Math.floor(Math.random() * leadSources.length);
          const aLeadSource = leadSources[randomNumber].value;
          newRecord["LeadSource"] = aLeadSource;
        }

        // Probability field
        randomNumber = Math.floor(Math.random() * 1);
        const probability = randomNumber;
        newRecord["Probability"] = probability;

        // ExpectedRevenue field
        let max = 1000000;
        let min = 100000;
        randomNumber = Math.floor(Math.random() * (max - min + 1) + min);
        const revenue = randomNumber;
        // newRecord["ExpectedRevenue"] = revenue;

        // CloseDate field
        randomNumber = Math.floor(Math.random() * 60);
        let aDate = new Date();
        aDate.setDate(randomNumber);
        newRecord["CloseDate"] = aDate;

        // create opportunity name (account name + opportunity type)
        const accntRec = accountMap.get(accntId);
        const accntName = accntRec.Name;
        const oppName = accntName + newRecord.Type;
        newRecord["Name"] = oppName;

        // Related To Account
        newRecord["AccountId"] = accntId;

        // Opportunity Owner
        const numUsers = users.length;
        randomNumber = Math.floor(Math.random() * numUsers);
        newRecord["OwnerId"] = users[randomNumber];

        records.push(newRecord);
      }
    });

    // store to database
    try {
      let response = await conn
        .sobject("Opportunity")
        .create(records, { allowRecursive: true });

      const insertedOpportunityIds = [];
      const errorRecs = [];
      response.forEach((res) => {
        if (res.success) {
          insertedOpportunityIds.push(res.id);
        } else {
          const errRec = {
            id: res.id,
            error: res.error,
          };
          errorRecs.push(errRec);
        }
      });

      const result = {
        insertedOpportunityIds: insertedOpportunityIds,
        errors: errorRecs,
      };

      return result;
    } catch (error) {
      console.log("Errors creating demo Opportunities");
      const result = {
        insertedOpportunityIds: [],
        errors: error,
      };
      return result;
    }
  }

  async function getAccounts(conn, accountIds) {
    // build the id condition
    let idStr = "";
    accountIds.forEach((el) => {
      idStr += `'${el}', `;
    });

    // remove last comma
    const recordIdStr = idStr.slice(0, -2);

    // get the account object
    let results = await conn
      .query(`Select Id, Name From Account WHERE Id IN (${recordIdStr})`)
      .execute({ autoFetch: true, maxFetch: 100000 });

    return results;
  }

  async function getObjMetadata(selectedObject, userInfo, conn) {
    try {
      var conn = fastify.conn;

      const profileName = userInfo.profileName;
      const profileId = userInfo.profileId;

      if (selectedObject === undefined) return;

      // let globalMeta = await conn.describeGlobal();

      // get the object metadata using describeGlobal
      let metaData = await conn.sobject(selectedObject).describe();

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
        val1 = a.name;
        val2 = b.name;
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
      WHERE SobjectType = '${selectedObject}'  AND ParentId IN (Select Id FROM PermissionSet where
      PermissionSet.Profile.Name = '${profileName}')`);

      const numPerms = perms.records.length;

      let permissionsMap = new Map();

      const permRecords = perms.records;

      permRecords.sort((a, b) => {
        val1 = a.Field;
        val2 = b.Field;
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
        let val1 = a.field;
        let val2 = b.field;
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

      return result;
    } catch (err) {
      fastify.log.error(err);
      throw new Error(`API error retrieving metadata for ${selectedObject}`);
    }
  }

  fastify.post("/createDemoData", async function (request, reply) {
    let users = [];
    let accounts = [];
    let contacts = [];
    let tasks = [];
    let events = [];
    let cases = [];
    let leads = [];
    let opportunities = [];

    // try {
    var conn = fastify.conn;

    var faker = fastify.faker;

    const payload = request.body;
    const sobjects = payload.sobjects;
    const numRecords = payload.numRecords;
    const userInfo = payload.userInfo;

    /* 
       metadata properties:
       childRelationships: childRelationships,
       fieldPermissions: fieldPermissions,
       fields: filteredFields,
       objectProperties: objectProperties,
       recordTypes: recordTypes,
       requiredFields: requiredFields,
     */

    try {
      let userResult = await getUsers(conn, users);
      if (userResult.status === "ok") {
        users = userResult.records;
      } else {
        throw new Error(userResult.errorMessage);
      }

      const accountMetadata = await getObjMetadata("Account", userInfo, conn);

      // always create demo accounts
      let accountResult = await createAccounts(
        conn,
        faker,
        numRecords,
        accountMetadata,
        accounts
      );

      if (accountResult.errors.length > 0) {
        console.log(accountResult.errors);
        throw new Error(accountResult.errors);
      }

      // get the full account records
      const accountRecords = await getAccounts(
        conn,
        accountResult.insertedRecIds
      );

      // store in a map - needed for creating Opportunities
      let accountMap = new Map();
      accountRecords.records.forEach((a) => {
        accountMap.set(a.Id, a);
      });

      // always create Contacts for Accounts
      let contactResult = null;

      const contactMetadata = await getObjMetadata("Contact", userInfo, conn);

      if (sobjects.includes("Contact")) {
        contactResult = await createContacts(
          conn,
          faker,
          accountResult.insertedRecIds,
          contactMetadata,
          contacts
        );

        if (contactResult.errors.length > 0) {
          console.log(contactResult.errors);
          throw new Error(contactResult.errors);
        }
      }

      // always create Leads
      let leadResult = null;

      const leadMetadata = await getObjMetadata("Lead", userInfo, conn);

      if (sobjects.includes("Lead")) {
        leadResult = await createLeads(conn, faker, leadMetadata, leads, users);

        if (leadResult.errors.length > 0) {
          console.log(leadResult.errors);
          throw new Error(leadResult.errors);
        }
      }

      let taskResult = null;

      const taskMetadata = await getObjMetadata("Task", userInfo, conn);

      // always create Tasks for Accounts
      if (sobjects.includes("Task")) {
        taskResult = await createTasks(
          conn,
          faker,
          users,
          accountResult.insertedRecIds,
          taskMetadata,
          tasks
        );

        if (taskResult.errors.length > 0) {
          console.log(taskResult.errors);
          throw new Error(taskResult.errors);
        }
      }

      // always create Events for Accounts
      let eventResult = null;

      const eventMetadata = await getObjMetadata("Event", userInfo, conn);

      if (sobjects.includes("Event")) {
        eventResult = await createEvents(
          conn,
          faker,
          users,
          accountResult.insertedRecIds,
          eventMetadata,
          events
        );

        if (eventResult.status === "error") {
          throw new Error(eventResult);
        }
      }

      // always create Cases for Accounts
      let caseResult = null;

      const caseMetadata = await getObjMetadata("Case", userInfo, conn);

      if (sobjects.includes("Case")) {
        caseResult = await createCases(
          conn,
          faker,
          users,
          accountResult.insertedRecIds,
          caseMetadata,
          cases
        );

        if (caseResult.errors.length > 0) {
          console.log(caseResult.errors);
          throw new Error(caseResult.errors);
        }
      }

      // always create Opportunities for Accounts
      let opportunityResult = null;

      const opportunityMetadata = await getObjMetadata(
        "Opportunity",
        userInfo,
        conn
      );

      if (sobjects.includes("Opportunity")) {
        opportunityResult = await createOpportunities(
          conn,
          faker,
          users,
          accountResult.insertedRecIds,
          accountMap,
          opportunityMetadata,
          opportunities
        );

        if (opportunityResult.errors.length > 0) {
          console.log(opportunityResult.errors);
          throw new Error(opportunityResult.errors);
        }
      }

      if (
        accountResult &&
        contactResult &&
        caseResult &&
        leadResult &&
        taskResult &&
        eventResult &&
        opportunityResult
      ) {
        return true;
      } else {
        return false;
      }
    } catch (error) {
      const returnVal = {
        status: "error",
        errorMessage: "Error creating demo records",
      };
      return returnVal;
    }
  });

  next();
}

