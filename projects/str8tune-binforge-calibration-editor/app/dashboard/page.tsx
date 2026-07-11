import Link from "next/link";
import { CarFront, FolderKanban, MessageSquareHeart, Palette, Upload } from "lucide-react";

const cards = [
  {
    title: "Garage Ready",
    body: "Supabase tables are set up for users, vehicles, tune projects, aliases, and saved preferences.",
    icon: CarFront,
  },
  {
    title: "Upload-First Workflow",
    body: "The editor now waits for real XDF and BIN assets instead of showing fake project content.",
    icon: Upload,
  },
  {
    title: "Persistent AI Dock",
    body: "The assistant stays in the workspace layout but defaults off until you add your tokens and API key.",
    icon: MessageSquareHeart,
  },
  {
    title: "Per-User Styling",
    body: "Theme colors, graph presentation, and visual depth are designed to persist per user profile.",
    icon: Palette,
  },
];

export default function DashboardPage() {
  return (
    <main className="dashboard-shell">
      <header className="dashboard-topbar">
        <div>
          <span className="eyebrow">Garage Dashboard</span>
          <h1>Real-file workflow first. No mock garage clutter.</h1>
          <p className="helper-copy">Once Supabase is wired, this screen becomes the live list of user vehicles and tune projects.</p>
        </div>
        <div className="hero-actions">
          <Link className="button button-secondary" href="/">
            Landing
          </Link>
          <Link className="button button-primary" href="/editor/project-live">
            Open Editor
          </Link>
        </div>
      </header>

      <section className="stats-grid">
        {cards.map(({ title, body, icon: Icon }) => (
          <article className="card-glass stat-card" key={title}>
            <div className="feature-icon">
              <Icon size={18} />
            </div>
            <strong>{title}</strong>
            <span>{body}</span>
          </article>
        ))}
      </section>

      <section className="card-glass empty-garage-panel">
        <span className="eyebrow">Next Step</span>
        <h2>Connect auth, add real assets, and this becomes the live garage.</h2>
        <p className="helper-copy">
          Vehicles and projects should come from Supabase, while real BIN and XDF assets enter through upload or storage-backed project records.
        </p>
      </section>
    </main>
  );
}
