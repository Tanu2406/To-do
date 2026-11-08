export const typeDefs = `#graphql
  scalar JSON

  type User {
    id: ID!
    username: String!
    createdAt: String
  }

  type Task {
    id: ID!
    task: String!
    isCompleted: Boolean!
    userId: ID
    createdAt: String
    updatedAt: String
  }

  type AuthPayload {
    token: String!
    user: User!
  }

  type TaskMutationPayload {
    task: Task
    taskId: ID
  }

  type Query {
    me: User
    tasks: [Task!]!
    task(id: ID!): Task
  }

  type Mutation {
    register(username: String!, password: String!): AuthPayload!
    login(username: String!, password: String!): AuthPayload!
    createTask(task: String!, isCompleted: Boolean): Task!
    updateTask(id: ID!, task: String, isCompleted: Boolean): Task!
    deleteTask(id: ID!): TaskMutationPayload!
  }

  type Subscription {
    taskChanged: TaskMutationPayload!
    taskCreated: Task!
    taskUpdated: Task!
    taskDeleted: Task!
  }
`;
