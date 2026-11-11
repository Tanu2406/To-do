import { useMemo, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RiCalendarTodoLine } from "react-icons/ri";
import { Toaster } from "react-hot-toast";
import NotesList from "./NotesList";
import { addNote, updateNote } from "./store/notesSlice";
import { logoutSession } from "./store/authSlice";
import styles from "./ToDoList.module.scss";

const ToDoList = () => {
  // Initial state object for a task
  const initialValue = {
    task: "",
  };

  const [addTask, setAddTask] = useState(initialValue);
  const dispatch = useDispatch();
  const { isSaving, error } = useSelector((state) => state.notes);
  const buttonText = useMemo(
    () => isSaving ? "Processing..." : addTask._id ? "UPDATE +" : "ADD +",
    [isSaving, addTask._id]
  );

  // Update input value
  const handleChange = (event) => {
    const { name, value } = event.target;
    setAddTask({ ...addTask, [name]: value });
  };

  // Add a new task or update an existing one
  const handleAddTask = async (event) => {
    event.preventDefault();
    const title = addTask.task.trim();
    if (!title) return;

    if (addTask._id) {
      const result = await dispatch(updateNote({
        id: addTask._id,
        title,
        content: addTask.content || title,
      }));
      if (!updateNote.rejected.match(result)) setAddTask(initialValue);
    } else {
      const result = await dispatch(addNote({ title, content: title }));
      if (!addNote.rejected.match(result)) setAddTask(initialValue);
    }
  };

  return (
    <>
      <main className={styles.page} id="main-content" tabIndex="-1">
        <div className={styles.card}>
          <div className={styles.heading}>
            <RiCalendarTodoLine aria-hidden="true" />
            <h1>Tasks</h1>
            <button type="button" className={styles.submitButton} onClick={() => dispatch(logoutSession())}>Logout</button>
          </div>

          {/* Form submission handles both button click and Enter key */}
          <form onSubmit={handleAddTask} className={styles.form}>
            <label className={styles.visuallyHidden} htmlFor="task">
              Task
            </label>
            <input
              id="task"
              name="task"
              type="text"
              required
              className={styles.input}
              value={addTask.task}
              onChange={(e) => {
                if (!isSaving) handleChange(e);
              }}
              placeholder="Add your task..."
              autoComplete="off"
            />

            <button
              type="submit"
              disabled={isSaving}
              className={styles.submitButton}
              aria-label={
                isSaving
                  ? "Processing task"
                  : addTask._id
                    ? "Update task"
                    : "Add task"
              }
            >
              {buttonText}
            </button>
          </form>

          {error && <p role="alert">{error}</p>}
          <NotesList setAddTask={setAddTask} />
        </div>
      </main>
      <Toaster position="top-right" />
    </>
  );
};

export default ToDoList;
