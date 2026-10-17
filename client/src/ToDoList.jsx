import { useState, useEffect } from "react";
import { useDispatch } from "react-redux";
import { RiCalendarTodoLine } from "react-icons/ri";
import axios from "axios";
import toast from "react-hot-toast";
import ListItem from "./ListItem";
import { API_BASE_URL } from "./api";
import { addTodo, editTodo, setTodos } from "./store/todoSlice";
import styles from "./ToDoList.module.scss";

const ToDoList = () => {
  // Initial state object for a task
  const initialValue = {
    task: "",
  };

  const [addTask, setAddTask] = useState(initialValue);
  const [isListLoading, setIsListLoading] = useState(true);
  const [isButtonLoading, setButtonLoading] = useState(false);
  const dispatch = useDispatch();

  // fetch todo using axios with async/await try/catch block
  const fetchTodoList = async () => {
    try {
      const response = await axios.get(`${API_BASE_URL}/get`);

      dispatch(setTodos(response.data));
    } catch (err) {
      const message =
        err.response?.data?.errorMessage || "Something went wrong!";
      console.error("Error:", message);
      toast.error(message);
    } finally {
      setIsListLoading(false);
    }
  };

  useEffect(() => {
    fetchTodoList();
  }, []);

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

          dispatch(addTodo(res.data.newList));
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
        <ListItem
          setAddTask={setAddTask}
          isListLoading={isListLoading}
        />
      </div>
    </div>
  );
};

export default ToDoList;
