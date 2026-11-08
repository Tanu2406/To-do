import { gql } from "@apollo/client";

export const LOGIN_MUTATION = gql`
  mutation Login($username: String!, $password: String!) {
    login(username: $username, password: $password) {
      token
      user { id username }
    }
  }
`;

export const REGISTER_MUTATION = gql`
  mutation Register($username: String!, $password: String!) {
    register(username: $username, password: $password) {
      token
      user { id username }
    }
  }
`;

export const TASKS_QUERY = gql`
  query Tasks {
    tasks {
      id
      task
      isCompleted
      createdAt
      updatedAt
    }
  }
`;

export const CREATE_TASK_MUTATION = gql`
  mutation CreateTask($task: String!) {
    createTask(task: $task) { id task isCompleted createdAt updatedAt }
  }
`;

export const UPDATE_TASK_MUTATION = gql`
  mutation UpdateTask($id: ID!, $task: String, $isCompleted: Boolean) {
    updateTask(id: $id, task: $task, isCompleted: $isCompleted) {
      id task isCompleted createdAt updatedAt
    }
  }
`;

export const DELETE_TASK_MUTATION = gql`
  mutation DeleteTask($id: ID!) {
    deleteTask(id: $id) { taskId task { id } }
  }
`;

export const TASK_CHANGED_SUBSCRIPTION = gql`
  subscription TaskChanged {
    taskChanged { taskId task { id task isCompleted createdAt updatedAt } }
  }
`;
