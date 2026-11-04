import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { fetchNotes } from "./store/notesSlice";
import ListItemSkeleton from "./ListItemSkeleton";
import styles from "./ListItem.module.scss";

const NotesList = () => {
  const dispatch = useDispatch();
  const { items, isLoading, error } = useSelector((state) => state.notes);

  useEffect(() => {
    dispatch(fetchNotes());
  }, [dispatch]);

  if (isLoading) {
    return <ul aria-label="Notes" aria-busy="true"><li><ListItemSkeleton /></li></ul>;
  }
  if (error) return <p role="alert">{error}</p>;
  if (items.length === 0) return <p>No notes yet.</p>;

  return (
    <ul className={styles.list} aria-label="Notes">
      {items.map((note) => <li className={styles.item} key={note._id}>{note.title}</li>)}
    </ul>
  );
};

export default NotesList;
