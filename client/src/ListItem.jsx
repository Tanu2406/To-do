import { FaCheckCircle, FaRegCircle } from "react-icons/fa";
import { RiDeleteBin6Line } from "react-icons/ri";
import { TbEdit } from "react-icons/tb";
import toast from "react-hot-toast";
import axios from "axios";
import Tooltip from "./Tooltip";
import ListItemSkeleton from "./ListItemSkeleton";
import { API_BASE_URL } from "./api";
import { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { deleteTodo, editTodo } from "./store/todoSlice";
import styles from "./ListItem.module.scss";

const ListItem = ({ setAddTask, isListLoading }) => {
  const [isDeleteLoading, setIsDeleteLoading] = useState(false);
  const [isCompleteLoading, setIsCompleteLoading] = useState(false);
  const dispatch = useDispatch();
  const todoList = useSelector((state) => state.todos);

  // Set task for editing
  const handleEdit = (task) => {
    setAddTask(task);
  };

  // Delete task using its unique id
  const handleDelete = (_id) => {
    const headers = {
      headers: {
        "Content-Type": "application/json",
      },
    };

    async function deleteTodoList() {
      setIsDeleteLoading(true);
      try {
        const res = await axios.delete(`${API_BASE_URL}/delete/${_id}`, headers);

        toast.success(res?.data?.message);
        dispatch(deleteTodo(_id));
      } catch (err) {
        const message =
          err.response?.data?.errorMessage || "Something went wrong!";
        console.error("Error:", message);
        toast.error(message);
      } finally {
        setIsDeleteLoading(false);
      }
    }
    deleteTodoList();
  };

  // Toggle completion for a task using its unique id
  const handleComplete = (currentTask) => {
    const changes = { isCompleted: !currentTask.isCompleted };

    const headers = {
      headers: {
        "Content-Type": "application/json",
      },
    };

    async function updateTodoList() {
      setIsCompleteLoading(true);
      try {
        const res = await axios.put(
          `${API_BASE_URL}/update/${currentTask._id}`,
          changes,
          headers
        );

        toast.success(
          currentTask.isCompleted
            ? `${currentTask.task} - Task not completed`
            : `${currentTask.task} - Task completed`
        );
        dispatch(editTodo(res.data.updated));
      } catch (err) {
        const message =
          err.response?.data?.errorMessage || "Something went wrong!";
        console.error("Error:", message);
        toast.error(message);
      } finally {
        setIsCompleteLoading(false);
      }
    }
    updateTodoList();
  };

  return (
    <div className={styles.list}>
      {isListLoading ? (
        <ListItemSkeleton />
      ) : (
        todoList.map((list) => (
          <div key={list._id} className={styles.item}>
            <div
              className={`${styles.task} ${
                isCompleteLoading ? styles.busy : ""
              }`}
              onClick={() => !isCompleteLoading && handleComplete(list)}
            >
              <span className={styles.completionIcon}>
                {list.isCompleted ? (
                  <FaCheckCircle
                    className={styles.completedIcon}
                    size={22}
                  />
                ) : (
                  <FaRegCircle className={styles.pendingIcon} size={22} />
                )}
              </span>

              <span
                className={`${styles.taskText} ${
                  list.isCompleted ? styles.completed : ""
                }`}
              >
                {list.task}
              </span>
            </div>

            <div className={styles.actions}>
              <Tooltip text="Edit">
                <div
                  className={styles.editAction}
                  onClick={() => handleEdit(list)}
                >
                  <TbEdit size={20} />
                </div>
              </Tooltip>
              <Tooltip text="Delete">
                <div
                  className={`${styles.deleteAction} ${
                    isDeleteLoading ? styles.disabled : ""
                  }`}
                  onClick={() => {
                    if (!isDeleteLoading) handleDelete(list._id);
                  }}
                >
                  <RiDeleteBin6Line size={20} />
                </div>
              </Tooltip>
            </div>
          </div>
        ))
      )}
    </div>
  );
};

export default ListItem;
