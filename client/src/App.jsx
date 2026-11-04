import { lazy, Suspense, useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import ListItemSkeleton from "./ListItemSkeleton";
import { isTokenExpired, login, logout } from "./store/authSlice";
import styles from "./ToDoList.module.scss";

const ToDoList = lazy(() => import("./ToDoList"));

const App = () => {
  const dispatch = useDispatch();
  const { token, isAuthenticated, isLoading, error } = useSelector((state) => state.auth);
  const [credentials, setCredentials] = useState({ username: "", password: "" });

  useEffect(() => {
    if (token && isTokenExpired(token)) dispatch(logout());
    const timer = window.setInterval(() => {
      if (token && isTokenExpired(token)) dispatch(logout());
    }, 30000);
    return () => window.clearInterval(timer);
  }, [dispatch, token]);

  if (!isAuthenticated) {
    return (
      <main className={styles.page}>
        <section className={styles.card}>
          <div className={styles.heading}><h1>Skillpilot Login</h1></div>
          <form className={styles.form} onSubmit={(event) => { event.preventDefault(); dispatch(login(credentials)); }}>
            <label className={styles.visuallyHidden} htmlFor="username">Username</label>
            <input id="username" className={styles.input} value={credentials.username} onChange={(event) => setCredentials({ ...credentials, username: event.target.value })} placeholder="Username" required autoComplete="username" />
            <label className={styles.visuallyHidden} htmlFor="password">Password</label>
            <input id="password" type="password" className={styles.input} value={credentials.password} onChange={(event) => setCredentials({ ...credentials, password: event.target.value })} placeholder="Password" required autoComplete="current-password" />
            {error && <p role="alert">{error}</p>}
            <button className={styles.submitButton} disabled={isLoading}>{isLoading ? "Signing in..." : "Login"}</button>
          </form>
        </section>
      </main>
    );
  }

  return (
    <>
      <a className={styles.skipLink} href="#main-content">Skip to main content</a>
      <Suspense fallback={<main className={styles.page}><section className={styles.card}><ListItemSkeleton /></section></main>}>
        <ToDoList />
      </Suspense>
    </>
  );
};

export default App;
