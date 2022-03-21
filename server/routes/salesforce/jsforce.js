module.exports = async function (fastify, options, next) {
  fastify.post("/jsforce", async function (request, reply) {
    const payload = request.body;

    const userName = payload.userName;
    const userPassword = payload.userPassword;
    const loginUrl = payload.loginUrl;

    var conn = fastify.conn;

    var userInfo = fastify.userInfo;

    var hostName = request.headers.host;

    let result = {
      success: true,
      userId: "",
      userEmail: "",
      userName: userName,
      userPassword: userPassword,
      locale: "",
      loginUrl: "",
      organizationId: "",
      profileId: "",
      profileName: "",
      hostName: "",
      sessionId: "",
    };

    if (
      loginUrl === "production" ||
      loginUrl === "https://login.salesforce.com"
    ) {
      conn.loginUrl = "https://login.salesforce.com";
      result.loginUrl = "production";
    } else if (
      loginUrl === "sandbox" ||
      loginUrl === "https://login.salesforce.com"
    ) {
      conn.loginUrl = "https://test.salesforce.com";
      result.loginUrl = "sandbox";
    }

    await conn.login(userName, userPassword, (err, userInfo) => {
      if (err) {
        //fastify.log.error(err);
        return err;
      }

      fastify.log.info(conn.accessToken);
      fastify.log.info(conn.instanceUrl);
      // logged in user property
      fastify.log.info("User ID: " + userInfo.id);
      fastify.log.info("Org ID: " + userInfo.organizationId);

      // result.conn = conn;

      result.userId = userInfo.id;
      result.organizationId = userInfo.organizationId;
      result.locale = userInfo.locale;
      result.sessionId = conn.accessToken;

      fastify.userInfo.userId = userInfo.id;
      fastify.userInfo.organizationId = userInfo.organizationId;
      fastify.userInfo.locale = userInfo.locale;
    });

    // get the user profile
    const pf = await conn.query(
      `SELECT Id, Name, Email, CompanyName, ProfileId, Profile.Name, LanguageLocaleKey
           FROM User
           WHERE Id = '${result.userId}'`
    );

    const profileInfo = pf.records[0];

    result.success = true;
    result.profileId = profileInfo.ProfileId;
    result.profileName = profileInfo.Profile.Name;
    result.userEmail = profileInfo.Email;
    result.locale = profileInfo.LanguageLocaleKey;
    // result.conn = conn;

    fastify.userInfo.userName = userName;
    fastify.userInfo.userPassword = userPassword;
    fastify.userInfo.loginUrl = loginUrl;
    fastify.userInfo.userEmail = profileInfo.Email;
    fastify.userInfo.profileId = profileInfo.ProfileId;
    fastify.userInfo.profileName = profileInfo.Profile.Name;
    fastify.userInfo.hostName = hostName;
    fastify.userInfo.locale = profileInfo.LanguageLocaleKey;
    fastify.userInfo.sessionId = conn.sessionId;

    return {
      status: "ok",
      errorMessage: null,
      data: result,
    };
  });

  next();
};
