import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchNotes } from "./store/notesSlice";
import ListItem from "./ListItem";
import ListItemSkeleton from "./ListItemSkeleton";

const NotesList = ({ setAddTask }) => {
  const dispatch = useDispatch();
  const { items, isLoading, error } = useSelector((state) => state.notes);
  const taskStats = useMemo(() => ({
    completed: items.filter((item) => item.isCompleted).length,
    remaining: items.filter((item) => !item.isCompleted).length,
  }), [items]);

  useEffect(() => {
    dispatch(fetchNotes());
  }, [dispatch]);

  if (isLoading) {
    return <ul aria-label="Notes" aria-busy="true"><li><ListItemSkeleton /></li></ul>;
  }
  if (error) return <p role="alert">{error}</p>;
  if (items.length === 0) return <p>No notes yet.</p>;

  return (
    <>
      <p aria-label="Task summary">
        {taskStats.remaining} remaining, {taskStats.completed} completed
      </p>
      <ListItem setAddTask={setAddTask} />
    </>
  );
};

export default NotesList;
