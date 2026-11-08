import { ApolloClient, ApolloLink, HttpLink, InMemoryCache, split } from "@apollo/client";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { getMainDefinition } from "@apollo/client/utilities";
import { createClient } from "graphql-ws";
import { API_BASE_URL, GRAPHQL_URL } from "./api";

const getToken = () => sessionStorage.getItem("skillpilot_token");
const graphqlUrl = GRAPHQL_URL || API_BASE_URL.replace(/\/api$/, "/graphql");

const httpLink = new HttpLink({
  uri: graphqlUrl,
  credentials: "include",
});

const authLink = new ApolloLink((operation, forward) => {
  const token = getToken();
  operation.setContext(({ headers = {} }) => ({
    headers: {
      ...headers,
      ...(token ? { Authorization: `Bearer ${token}` } : {}),
    },
  }));
  return forward(operation);
});

const wsLink = new GraphQLWsLink(createClient({
  url: graphqlUrl.replace(/^http/, "ws"),
  connectionParams: () => {
    const token = getToken();
    return token ? { Authorization: `Bearer ${token}` } : {};
  },
}));

const link = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return definition.kind === "OperationDefinition" && definition.operation === "subscription";
  },
  wsLink,
  authLink.concat(httpLink)
);

export const apolloClient = new ApolloClient({
  cache: new InMemoryCache(),
  link,
});
