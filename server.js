/*
    - using ES5 modules because jsforce not available for ES6
    - execute 'npm run dev' to start watcher
*/

// "proxy": "http://localhost:5000",

const path = require("path");

// Read the .env file.
require("dotenv").config();

// check .env file
const { SF_LOGIN_URL, DATABASE_URL, NODE_ENV } = process.env;

if (!SF_LOGIN_URL) {
  console.error(
    "Cannot start app: missing SF_LOGIN_URL mandatory configuration. Check your .env file."
  );
  process.exit(-1);
}

if (!DATABASE_URL) {
  console.error(
    "Cannot start app: missing DATABASE_URL mandatory configuration. Check your .env file."
  );
  process.exit(-1);
}

const fastify = require("fastify")({
  logger: false,
  ignoreTrailingSlash: true,
  bodyLimit: 104857600, // 100MB
});

// Swagger API documentation plugin
fastify.register(require("fastify-swagger"), {
  exposeRoute: true,
  routePrefix: "/docs",
  swagger: {
    info: { title: "fastify-api" },
  },
});

// register knexjs query builder
// automatically adds a decorator 'fastify.knex'
fastify.register(require("fastify-knexjs"), {
  client: "pg",
  connection: {
    connectionString: process.env.DATABASE_URL,
    ssl: { rejectUnauthorized: false },
  },
  debug: false,
});

// Salesforce API
var jsforce = require("jsforce");
let conn = new jsforce.Connection({
  version: "53.0",
});

// creates a fastify decorator so we can pass
// jsforce to the routes
fastify.decorate("conn", {
  getter() {
    return conn;
  },
});

// superagent - used for performing fetch api requests in the server
const superagent = require("superagent");

// fastify-url-data
fastify.register(require("fastify-url-data"));

// creates a fastify decorator so we can use node fetch in our routes
fastify.decorate("superagent", {
  getter() {
    return superagent;
  },
});

fastify.register(require("fastify-static"), {
  root: path.join(__dirname, "build"),
});

fastify.get("/", function (req, res) {
  res.sendFile("index.html");
});

// APPLICATION VARIABLES
let metadataMap = new Map();

// creates a fastify decorator so we can pass
// metadata to the routes
fastify.decorate("metadataMap", {
  getter() {
    return metadataMap;
  },
});

// used for salesforce queries
let accessToken;
let oauth2;
let userId;
let userEmail;
let userPassword;
let organizationId;
let profileId;
let profileName;

let userInfo = {
  userId: userId,
  userEmail: userEmail,
  userPassword: userPassword,
  organizationId: organizationId,
  profileId: profileId,
  profileName: profileName,
};

// creates a fastify decorator so we can pass
// userInfo to the routes
fastify.decorate("userInfo", {
  getter() {
    return userInfo;
  },
});

// ROUTES
const autoload = require("fastify-autoload");

fastify.register(autoload, {
  dir: path.join(__dirname, "server/routes"),
});

// FASTIFY-SOCKET.IO CONFIG
fastify.register(require("fastify-cors"), {
  origin: "*",
  methods: "GET,POST,PUT,PATCH,DELETE",
});

// by default, all domains are authorized
fastify.register(require("fastify-socket.io"));

// fastify.register(require("fastify-socket.io"), {
//   cors: {
//     // origin: "http://localhost:3000",
//     origin: "*",
//     methods: ["GET", "POST", "PUT", "PATCH", "DELETE"],
//   },
// });

let interval;

const getApiAndEmit = (socket) => {
  const response = new Date();
  // Emitting a new message. Will be consumed by the client
  socket.emit("GridData", response);
};

// RUN THE SERVER  Note - need '0.0.0.0' for Heroku
const Port = process.env.PORT || 4000;
const start = async () => {
  try {
    await fastify.listen(Port, "0.0.0.0");
    fastify.log.info(`server listening on ${fastify.server.address().port}`);
  } catch (err) {
    fastify.log.error(err);
    process.exit(1);
  }
};
start();

const sendClientMessage = (socket) => {
  const response = new Date();
  const message = `Grid message received from server at ${response}`;
  // Emitting a new message. Will be consumed by the client
  socket.emit("GridData", message);
};

fastify.ready().then(() => {
  // we need to wait for the server to be ready, else `server.io` is undefined
  fastify.io.on("connection", (socket) => {
    console.info(`Socket connected!" ${socket.id}`);

    // interval = setInterval(() => getApiAndEmit(socket), 5000);
    // send confirmation message to grid
    socket.emit("GridData", "Grid socket connected");

    // test server > client socket
    const myTimeout = setTimeout(() => {
      sendClientMessage(socket);
    }, 5000);

    socket.on("message", (data) => {
      console.log(data);
    });

    socket.on("disconnect", () => {
      console.log("Client disconnected");
      clearInterval(interval);
    });
  });
});

// not current used
// const { Worker, isMainThread, parentPort } = require("worker_threads");

/*  faker corrupted
const faker = require("faker");

// creates a fastify decorator so we can pass
// faker to the routes
fastify.decorate("faker", {
  getter() {
    return faker;
  },
});
*/
