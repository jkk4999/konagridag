import React from "react";
// import ReactDOM from "react-dom";
import { Provider } from "react-redux";
import store from "./store/store";
import App from "./app/App";

import "./index.css";

// React 18
import { createRoot } from "react-dom/client";
const container = document.getElementById("root");
const root = createRoot(container);

root.render(
  <Provider store={store}>
    <App tab='KonaGrid' />
  </Provider>
);

// ReactDOM.render(
//   <React.StrictMode>
//     <Provider store={store}>
//       <App />
//     </Provider>
//   </React.StrictMode>,
//   document.getElementById("root")
// );
