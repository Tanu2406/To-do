import { memo, useCallback } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RiCheckboxBlankCircleLine, RiCheckboxCircleFill, RiDeleteBin6Line } from "react-icons/ri";
import { TbEdit } from "react-icons/tb";
import Tooltip from "./Tooltip";
import ListItemSkeleton from "./ListItemSkeleton";
import { deleteNote, updateNote } from "./store/notesSlice";
import styles from "./ListItem.module.scss";

const NoteRow = memo(function NoteRow({ note, setAddTask, onDelete, isSaving }) {
  const dispatch = useDispatch();
  const title = note.title || note.task;
  const editNote = () => setAddTask({ _id: note._id, task: title });

  return (
    <li className={styles.item}>
      <button
        type="button"
        className={styles.task}
        aria-label={`${note.isCompleted ? "Mark incomplete" : "Mark complete"}: ${title}`}
        disabled={isSaving}
        onClick={() => dispatch(updateNote({ id: note._id, isCompleted: !note.isCompleted }))}
      >
        {note.isCompleted
          ? <RiCheckboxCircleFill className={styles.completedIcon} aria-hidden="true" />
          : <RiCheckboxBlankCircleLine className={styles.pendingIcon} aria-hidden="true" />}
        <span className={`${styles.taskText} ${note.isCompleted ? styles.completed : ""}`}>{title}</span>
      </button>
      <div className={styles.actions}>
        <Tooltip text="Edit">
          <button type="button" className={styles.editAction} aria-label={`Edit task: ${title}`} onClick={editNote}>
            <TbEdit size={20} aria-hidden="true" />
          </button>
        </Tooltip>
        <Tooltip text="Delete">
          <button type="button" className={styles.deleteAction} aria-label={`Delete task: ${title}`} disabled={isSaving} onClick={() => onDelete(note._id)}>
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
