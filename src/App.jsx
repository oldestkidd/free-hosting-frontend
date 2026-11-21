
import { useEffect, useState } from "react";
import "./App.css";

const API_URL = "https://oldestkidd-api.onrender.com";

function App() {
  const [projects, setProjects] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    fetch(`${API_URL}/db-test`)
      .then((response) => {
        if (!response.ok) {
          throw new Error("Failed to retrieve projects");
        }
        return response.json();
      })
      .then((data) => {
        setProjects(data.projects);
        setLoading(false);
      })
      .catch((err) => {
        console.error(err);
        setError("Could not connect to the backend. Please try again.");
        setLoading(false);
      });
  }, []);

  return (
    <main className="container">
      <header>
        <h1>My Projects</h1>
        <p>Projects retrieved from Supabase PostgreSQL</p>
      </header>

      {loading && <p>Loading projects...</p>}

      {error && <p className="error">{error}</p>}

      {!loading && !error && (
        <section className="projects">
          {projects.map((project) => (
            <article className="project-card" key={project.id}>
              <h2>{project.project_name}</h2>
              <span className="status">{project.status}</span>
            </article>
          ))}
        </section>
      )}

      <footer>
        <p>Powered by React, Render and Supabase</p>
      </footer>
    </main>
  );
}

export default App;
