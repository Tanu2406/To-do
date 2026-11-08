import { useSubscription } from "@apollo/client/react";
import { useDispatch } from "react-redux";
import { TASK_CHANGED_SUBSCRIPTION } from "./graphql";
import { taskDeleted, taskCreatedOrUpdated } from "./store/notesSlice";

const TaskSubscriptions = () => {
  const dispatch = useDispatch();
  useSubscription(TASK_CHANGED_SUBSCRIPTION, {
    onData: ({ data }) => {
      const change = data.data?.taskChanged;
      if (change?.task) dispatch(taskCreatedOrUpdated(change.task));
      else if (change?.taskId) dispatch(taskDeleted(change.taskId));
    },
  });
  return null;
};

export default TaskSubscriptions;
