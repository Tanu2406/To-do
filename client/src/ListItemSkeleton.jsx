import styles from "./ListItemSkeleton.module.scss";

const ListItemSkeleton = () => {
  return (
    <div className={styles.skeletonList}>
      {Array(5)
        .fill(0)
        .map((_, index) => (
          <div key={index} className={styles.item}>
            <div className={styles.taskPlaceholder}>
              {/* Circle Placeholder */}
              <div className={styles.circle}></div>

              {/* Text Placeholder */}
              <div className={styles.text}></div>
            </div>

            {/* Button Placeholders */}
            <div className={styles.actions}>
              <div className={styles.button}></div>
              <div className={styles.button}></div>
            </div>
          </div>
        ))}
    </div>
  );
};

export default ListItemSkeleton;
