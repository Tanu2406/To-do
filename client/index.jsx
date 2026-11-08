import { createRoot } from "react-dom/client";
import { Provider } from "react-redux";
import { ApolloProvider } from "@apollo/client/react";
import "./index.scss";
import App from "./src/App";
import { store } from "./src/store/store";
import { apolloClient } from "./src/apolloClient";

createRoot(document.getElementById("root")).render(
  <ApolloProvider client={apolloClient}>
    <Provider store={store}>
      <App />
    </Provider>
  </ApolloProvider>
);
