import { memo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RiDeleteBin6Line } from "react-icons/ri";
import { TbEdit } from "react-icons/tb";
import Tooltip from "./Tooltip";
import ListItemSkeleton from "./ListItemSkeleton";
import { deleteNote } from "./store/notesSlice";
import styles from "./ListItem.module.scss";

const NoteRow = memo(function NoteRow({ note, setAddTask, onDelete, isSaving }) {
  const editNote = () => setAddTask({ _id: note._id, task: note.title, content: note.content });

  return (
    <li className={styles.item}>
      <span className={styles.task}>{note.title}</span>
      <div className={styles.actions}>
        <Tooltip text="Edit">
          <button type="button" className={styles.editAction} aria-label={`Edit note: ${note.title}`} onClick={editNote}>
            <TbEdit size={20} aria-hidden="true" />
          </button>
        </Tooltip>
        <Tooltip text="Delete">
          <button type="button" className={styles.deleteAction} aria-label={`Delete note: ${note.title}`} disabled={isSaving} onClick={() => onDelete(note._id)}>
            <RiDeleteBin6Line size={20} aria-hidden="true" />
          </button>
        </Tooltip>
      </div>
    </li>
  );
});

const ListItem = ({ setAddTask, isListLoading }) => {
  const dispatch = useDispatch();
  const { items, isSaving } = useSelector((state) => state.notes);
  const handleDelete = useCallback((id) => dispatch(deleteNote(id)), [dispatch]);

  if (isListLoading) {
    return <ul className={styles.list} aria-busy="true"><li><ListItemSkeleton /></li></ul>;
  }

  return (
    <ul className={styles.list} aria-label="Notes">
      {items.map((note) => (
        <NoteRow key={note._id} note={note} setAddTask={setAddTask} onDelete={handleDelete} isSaving={isSaving} />
      ))}
    </ul>
  );
};

export default ListItem;
