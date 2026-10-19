import { useState, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { RiCalendarTodoLine } from "react-icons/ri";
import axios from "axios";
import toast from "react-hot-toast";
import { io } from "socket.io-client";
import ListItem from "./ListItem";
import { API_BASE_URL, SOCKET_URL } from "./api";
import {
  deleteTodo,
  editTodo,
  setTodos,
  upsertTodo,
} from "./store/todoSlice";
import styles from "./ToDoList.module.scss";

const socket = io(SOCKET_URL, {
  autoConnect: false,
  reconnection: true,
});

const ToDoList = () => {
  // Initial state object for a task
  const initialValue = {
    task: "",
  };

  const [addTask, setAddTask] = useState(initialValue);
  const [isListLoading, setIsListLoading] = useState(true);
  const [isButtonLoading, setButtonLoading] = useState(false);
  const [connectionStatus, setConnectionStatus] = useState("disconnected");
  const dispatch = useDispatch();
  const pendingSocketEvents = useRef(null);

  useEffect(() => {
    let isActive = true;
    let hasConnected = false;
    let failedInitialConnection = false;
    let syncRequested = false;
    const queueOrDispatch = (action) => {
      if (pendingSocketEvents.current) {
        pendingSocketEvents.current.push(action);
      } else {
        dispatch(action);
      }
    };
    const handleCreated = (todo) => queueOrDispatch(upsertTodo(todo));
    const handleUpdated = (todo) => queueOrDispatch(upsertTodo(todo));
    const handleDeleted = ({ _id }) => queueOrDispatch(deleteTodo(_id));
    const refreshTodoList = async () => {
      if (!isActive) return;
      if (pendingSocketEvents.current) {
        syncRequested = true;
        return;
      }

      pendingSocketEvents.current = [];
      try {
        const response = await axios.get(`${API_BASE_URL}/get`);
        if (!isActive) return;

        dispatch(setTodos(response.data));
      } catch (err) {
        if (!isActive) return;
        const message =
          err.response?.data?.errorMessage || "Something went wrong!";
        console.error("Error:", message);
        toast.error(message);
      } finally {
        if (isActive) {
          pendingSocketEvents.current.forEach((action) => dispatch(action));
          pendingSocketEvents.current = null;
          setIsListLoading(false);

          if (syncRequested) {
            syncRequested = false;
            refreshTodoList();
          }
        }
      }
    };
    const handleConnect = () => {
      setConnectionStatus("connected");
      if (hasConnected || failedInitialConnection) {
        refreshTodoList();
      }
      hasConnected = true;
      failedInitialConnection = false;
    };
    const handleDisconnect = () => {
      setConnectionStatus(socket.active ? "reconnecting" : "disconnected");
    };
    const handleConnectError = () => {
      setConnectionStatus(socket.active ? "reconnecting" : "disconnected");
      if (!hasConnected) failedInitialConnection = true;
    };

    pendingSocketEvents.current = null;
    socket.on("todo:created", handleCreated);
    socket.on("todo:updated", handleUpdated);
    socket.on("todo:deleted", handleDeleted);
    socket.on("connect", handleConnect);
    socket.on("disconnect", handleDisconnect);
    socket.on("connect_error", handleConnectError);
    socket.connect();
    refreshTodoList();

    return () => {
      isActive = false;
      pendingSocketEvents.current = null;
      socket.off("todo:created", handleCreated);
      socket.off("todo:updated", handleUpdated);
      socket.off("todo:deleted", handleDeleted);
      socket.off("connect", handleConnect);
      socket.off("disconnect", handleDisconnect);
      socket.off("connect_error", handleConnectError);
      socket.disconnect();
    };
  }, [dispatch]);

  // Update input value
  const handleChange = (event) => {
    const { name, value } = event.target;
    setAddTask({ ...addTask, [name]: value });
  };

  // Add a new task or update an existing one
  const handleAddTask = (event) => {
    event.preventDefault();
    if (!addTask.task.trim()) return;

    if (addTask._id) {
      const todoId = addTask._id;
      const updatedTask = { task: addTask.task.trim() };

      const headers = {
        headers: {
          "Content-Type": "application/json",
        },
      };

      setButtonLoading(true);
      async function updateTodoList() {
        try {
          const res = await axios.put(
            `${API_BASE_URL}/update/${todoId}`,
            updatedTask,
            headers
          );
          toast.success(res?.data?.message);

          dispatch(editTodo(res.data.updated));
          setAddTask(initialValue);
        } catch (err) {
          const message =
            err.response?.data?.errorMessage || "Something went wrong!";
          console.error("Error:", message);
          toast.error(message);
        } finally {
          setButtonLoading(false);
        }
      }
      updateTodoList();
    } else {
      // Create a new task
      const newTask = {
        task: addTask.task.trim(),
      };

      const headers = {
        headers: {
          "Content-Type": "application/json",
        },
      };

      setButtonLoading(true);
      async function createTodoList() {
        try {
          const res = await axios.post(`${API_BASE_URL}/new`, newTask, headers);

          dispatch(upsertTodo(res.data.newList));
          toast.success(res?.data?.message);

          setAddTask(initialValue);
        } catch (err) {
          const message =
            err.response?.data?.errorMessage || "Something went wrong!";
          console.error("Error:", message);
          toast.error(message);
        } finally {
          setButtonLoading(false);
        }
      }
      createTodoList();
    }
  };

  const buttonText = () => {
    if (isButtonLoading) {
      return "Processing...";
    } else if (addTask._id) {
      return "UPDATE +";
    } else {
      return "ADD +";
    }
  };

  return (
    <div className={styles.page}>
      <div className={styles.card}>
        <div className={styles.heading}>
          <RiCalendarTodoLine />
          <h1>To-Do List</h1>
          <div
            className={`${styles.connectionStatus} ${styles[connectionStatus]}`}
            role="status"
            aria-live="polite"
          >
            <span className={styles.connectionIndicator} aria-hidden="true" />
            {connectionStatus === "connected"
              ? "Connected"
              : connectionStatus === "reconnecting"
                ? "Reconnecting"
                : "Disconnected"}
          </div>
        </div>

        {/* Form submission handles both button click and Enter key */}
        <form onSubmit={handleAddTask} className={styles.form}>
          <input
            id="task"
            name="task"
            type="text"
            required
            className={styles.input}
            value={addTask.task}
            onChange={(e) => {
              if (!isButtonLoading) {
                handleChange(e);
              }
            }}
            placeholder="Add your task..."
            autoComplete="off"
          />

          <button
            type="submit"
            disabled={isButtonLoading}
            className={styles.submitButton}
          >
            {buttonText()}
          </button>
        </form>

        {/* Render tasks using ListItem component */}
        <ListItem setAddTask={setAddTask} isListLoading={isListLoading} />
      </div>
    </div>
  );
};

export default ToDoList;
