import React from "react";
import ReactDOM from "react-dom/client";
import App from "./App";

//ESTILOS DE AWS AMPLIFY UI (OBLIGATORIO)
import "@aws-amplify/ui-react/styles.css";
import "@aws-amplify/ui-react-liveness/styles.css";

ReactDOM.createRoot(document.getElementById("root")!).render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
);
