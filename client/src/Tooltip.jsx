import styles from "./Tooltip.module.scss";

const Tooltip = (props) => {
  const { text, children } = props;

  return (
    <div className={styles.tooltip}>
      {children}
      <div className={styles.position}>
        <div className={styles.content}>
          {text}
          <div className={styles.arrow}></div>
        </div>
      </div>
    </div>
  );
};

export default Tooltip;