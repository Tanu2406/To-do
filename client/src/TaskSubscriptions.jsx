import { useEffect, useState } from "react";
import { useSubscription } from "@apollo/client/react";
import { io } from "socket.io-client";
import { useDispatch } from "react-redux";
import { SOCKET_URL } from "./api";
import { TASK_CHANGED_SUBSCRIPTION } from "./graphql";
import { taskDeleted, taskCreatedOrUpdated } from "./store/notesSlice";
import styles from "./ToDoList.module.scss";

const TaskSubscriptions = () => {
  const dispatch = useDispatch();
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    const socket = io(SOCKET_URL, { withCredentials: true });
    const onTask = (task) => dispatch(taskCreatedOrUpdated(task));
    const onDelete = (task) => dispatch(taskDeleted(task.id || task._id));

    socket.on("connect", () => setIsConnected(true));
    socket.on("disconnect", () => setIsConnected(false));
    socket.on("taskCreated", onTask);
    socket.on("taskUpdated", onTask);
    socket.on("taskDeleted", onDelete);

    return () => {
      socket.disconnect();
    };
  }, [dispatch]);

  useSubscription(TASK_CHANGED_SUBSCRIPTION, {
    onData: ({ data }) => {
      const change = data.data?.taskChanged;
      if (change?.task) dispatch(taskCreatedOrUpdated(change.task));
      else if (change?.taskId) dispatch(taskDeleted(change.taskId));
    },
  });

  return (
    <p className={`${styles.connectionStatus} ${isConnected ? styles.connected : styles.reconnecting}`} aria-live="polite">
      <span className={styles.connectionIndicator} aria-hidden="true" />
      {isConnected ? "Live updates connected" : "Connecting to live updates"}
    </p>
  );
};

export default TaskSubscriptions;
