import { lazy, Suspense, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import ListItemSkeleton from "./ListItemSkeleton";
import {
  login,
  logoutSession,
  register,
  restoreSession,
} from "./store/authSlice";
import styles from "./ToDoList.module.scss";
import TaskSubscriptions from "./TaskSubscriptions";

const ToDoList = lazy(() => import("./ToDoList"));

const App = () => {
  const dispatch = useDispatch();
  const { isAuthenticated, isCheckingSession, isLoading, error } = useSelector((state) => state.auth);
  const [credentials, setCredentials] = useState({ username: "", password: "" });
  const [isRegistering, setIsRegistering] = useState(false);

  useEffect(() => {
    dispatch(restoreSession());
  }, [dispatch]);

  if (isCheckingSession) {
    return <main className={styles.page}><section className={styles.card}><ListItemSkeleton /></section></main>;
  }

  if (!isAuthenticated) {
    const submit = (event) => {
      event.preventDefault();
      dispatch(isRegistering ? register(credentials) : login(credentials));
    };

    return (
      <main className={styles.page}>
        <section className={styles.card}>
          <div className={styles.heading}>
            <h1>{isRegistering ? "Create your account" : "Skillpilot Login"}</h1>
          </div>
          <form className={styles.form} onSubmit={submit}>
            <label className={styles.visuallyHidden} htmlFor="username">Username</label>
            <input id="username" className={styles.input} value={credentials.username} onChange={(event) => setCredentials({ ...credentials, username: event.target.value })} placeholder="Username" required minLength={3} maxLength={50} autoComplete="username" />
            <label className={styles.visuallyHidden} htmlFor="password">Password</label>
            <input id="password" type="password" className={styles.input} value={credentials.password} onChange={(event) => setCredentials({ ...credentials, password: event.target.value })} placeholder="Password" required minLength={6} maxLength={72} autoComplete={isRegistering ? "new-password" : "current-password"} />
            {error && <p role="alert">{error}</p>}
            <button className={styles.submitButton} disabled={isLoading}>{isLoading ? "Please wait..." : isRegistering ? "Register" : "Login"}</button>
          </form>
          <button type="button" className={styles.authSwitch} onClick={() => { setIsRegistering(!isRegistering); }}>
            {isRegistering ? "Already have an account? Login" : "New here? Create an account"}
          </button>
        </section>
      </main>
    );
  }

  return (
    <>
      <a className={styles.skipLink} href="#main-content">Skip to main content</a>
      <TaskSubscriptions />
      <Suspense fallback={<main className={styles.page}><section className={styles.card}><ListItemSkeleton /></section></main>}>
        <ToDoList />
      </Suspense>
    </>
  );
};

export default App;
