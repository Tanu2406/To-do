import { ApolloClient, HttpLink, InMemoryCache, split } from "@apollo/client";
import { GraphQLWsLink } from "@apollo/client/link/subscriptions";
import { getMainDefinition } from "@apollo/client/utilities";
import { createClient } from "graphql-ws";
import { API_BASE_URL, GRAPHQL_URL } from "./api";

const graphqlUrl = GRAPHQL_URL || API_BASE_URL.replace(/\/api$/, "/graphql");
const httpLink = new HttpLink({
  uri: graphqlUrl,
  credentials: "include",
});
const wsLink = new GraphQLWsLink(createClient({
  url: graphqlUrl.replace(/^http/, "ws"),
}));

const link = split(
  ({ query }) => {
    const definition = getMainDefinition(query);
    return definition.kind === "OperationDefinition" && definition.operation === "subscription";
  },
  wsLink,
  httpLink
);

export const apolloClient = new ApolloClient({
  cache: new InMemoryCache(),
  link,
});
