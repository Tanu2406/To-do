import { useEffect, useMemo } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchNotes } from "./store/notesSlice";
import ListItemSkeleton from "./ListItemSkeleton";
import styles from "./ListItem.module.scss";

const NotesList = () => {
  const dispatch = useDispatch();
  const { items, isLoading, error } = useSelector((state) => state.notes);
  const sortedNotes = useMemo(
    () => [...items].sort((left, right) => String(left.title).localeCompare(String(right.title))),
    [items]
  );
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
      <ul className={styles.list} aria-label="Notes">
        {sortedNotes.map((note) => <li className={styles.item} key={note._id}>{note.title}</li>)}
      </ul>
    </>
  );
};

export default NotesList;
