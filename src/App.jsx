import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import "./App.css";

const API_URL = "https://oldestkidd-api.onrender.com";
const THEME_KEY = "fh-theme";

const getInitialTheme = () => {
  try {
    const stored = localStorage.getItem(THEME_KEY);
    if (stored === "light" || stored === "dark") return stored;
  } catch {
    /* storage can be unavailable in private modes */
  }
  return window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";
};

function SunIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <circle cx="12" cy="12" r="4" />
      <path d="M12 2v2M12 20v2M4.9 4.9l1.4 1.4M17.7 17.7l1.4 1.4M2 12h2M20 12h2M4.9 19.1l1.4-1.4M17.7 6.3l1.4-1.4" />
    </svg>
  );
}

function MoonIcon() {
  return (
    <svg viewBox="0 0 24 24" aria-hidden="true">
      <path d="M21 12.8A9 9 0 1 1 11.2 3a7 7 0 0 0 9.8 9.8z" />
    </svg>
  );
}

function App() {
  const [theme, setTheme] = useState(getInitialTheme);
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const [query, setQuery] = useState("");
  const [fetchedAt, setFetchedAt] = useState(null);
  const requestRef = useRef(0);

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    try {
      localStorage.setItem(THEME_KEY, theme);
    } catch {
      /* ignore */
    }
  }, [theme]);

  const loadProjects = useCallback(async (signal) => {
    const requestId = ++requestRef.current;
    setLoading(true);
    setError("");
    try {
      const response = await fetch(`${API_URL}/api/v1/projects`, { signal });
      if (!response.ok) throw new Error(`Request failed with ${response.status}`);
      const data = await response.json();
      if (requestId !== requestRef.current) return;
      setProjects(Array.isArray(data.projects) ? data.projects : []);
      setFetchedAt(new Date());
      setLoading(false);
    } catch (err) {
      if (requestId !== requestRef.current || err.name === "AbortError") return;
      console.error(err);
      setError("Could not reach the API. Check the connection and try again.");
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    const controller = new AbortController();
    loadProjects(controller.signal);
    return () => controller.abort();
  }, [loadProjects]);

  const trimmed = query.trim();
  const filtered = useMemo(() => {
    const q = trimmed.toLowerCase();
    if (!q) return projects;
    return projects.filter((project) =>
      `${project.project_name} ${project.status ?? ""}`.toLowerCase().includes(q)
    );
  }, [projects, trimmed]);

  const updatedLabel = fetchedAt
    ? fetchedAt.toLocaleString(undefined, {
        day: "2-digit",
        month: "short",
        hour: "2-digit",
        minute: "2-digit",
      })
    : null;

  return (
    <>
      <a className="skip-link" href="#main">
        Skip to content
      </a>

      <div className="app">
        <header className="app-header">
          <div className="container app-header__inner">
            <div>
              <h1>Projects</h1>
              <p className="app-header__sub">Live from Supabase PostgreSQL via the Render API</p>
            </div>
            <div className="app-header__actions">
              <span
                className={`api-status ${error ? "is-down" : loading ? "is-waiting" : "is-up"}`}
                role="status"
              >
                <span className="api-status__dot" aria-hidden="true" />
                {error ? "API unreachable" : loading ? "Connecting" : "API online"}
              </span>
              <button
                type="button"
                className="icon-btn"
                onClick={() => setTheme((current) => (current === "dark" ? "light" : "dark"))}
                aria-label={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
                aria-pressed={theme === "dark"}
                title={`Switch to ${theme === "dark" ? "light" : "dark"} theme`}
              >
                {theme === "dark" ? <SunIcon /> : <MoonIcon />}
              </button>
            </div>
          </div>
        </header>

        <main className="container" id="main">
          <div className="toolbar">
            <label className="search">
              <svg viewBox="0 0 24 24" aria-hidden="true" className="search__icon">
                <circle cx="11" cy="11" r="7" />
                <path d="m20 20-3.5-3.5" />
              </svg>
              <input
                type="search"
                value={query}
                onChange={(event) => setQuery(event.target.value)}
                placeholder="Search projects"
                aria-label="Search projects"
              />
            </label>
            {!loading && !error && (
              <p className="toolbar__meta">
                <span className="tabular">{filtered.length}</span> of{" "}
                <span className="tabular">{projects.length}</span> projects
                {updatedLabel && (
                  <>
                    {" "}
                    · updated <span className="tabular">{updatedLabel}</span>
                  </>
                )}
              </p>
            )}
          </div>

          {loading && (
            <section className="projects" aria-label="Loading projects" aria-busy="true">
              {[0, 1, 2].map((index) => (
                <div className="project-card skeleton" key={index}>
                  <span className="skeleton__line skeleton__line--title" />
                  <span className="skeleton__line skeleton__line--badge" />
                </div>
              ))}
            </section>
          )}

          {!loading && error && (
            <div className="state state--error" role="alert">
              <p>{error}</p>
              <button type="button" className="btn" onClick={() => loadProjects()}>
                Try again
              </button>
            </div>
          )}

          {!loading && !error && filtered.length === 0 && (
            <div className="state">
              <p>
                {projects.length === 0
                  ? "No projects have been added yet."
                  : `No projects match “${trimmed}”.`}
              </p>
              <button type="button" className="btn" onClick={() => loadProjects()}>
                Refresh
              </button>
            </div>
          )}

          {!loading && !error && filtered.length > 0 && (
            <section className="projects" aria-label="Projects">
              {filtered.map((project) => (
                <article className="project-card" key={project.id}>
                  <h2>{project.project_name}</h2>
                  {project.status && <span className="status">{project.status}</span>}
                </article>
              ))}
            </section>
          )}
        </main>

        <footer className="container app-footer">
          <p>React · Render · Supabase — static front end, live data</p>
        </footer>
      </div>
    </>
  );
}

export default App;
