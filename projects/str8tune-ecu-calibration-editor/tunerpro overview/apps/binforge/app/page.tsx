import Link from "next/link";
import { ArrowRight, Binary, CarFront, DatabaseZap, MessageSquareHeart, Palette, ScanSearch } from "lucide-react";

const valueProps = [
  {
    icon: CarFront,
    title: "Vehicle-First Workflow",
    body: "Tuners can organize by car, customer, ECU, and project so their whole garage stays fast to navigate.",
  },
  {
    icon: Palette,
    title: "Gorgeous Custom UI",
    body: "User theme controls cover colors, graph surface styling, shadows, density, and presentation without looking cheap.",
  },
  {
    icon: ScanSearch,
    title: "Table Intelligence",
    body: "Rename tables, auto-sort them, filter them instantly, and keep custom alias layers tied to the project.",
  },
  {
    icon: MessageSquareHeart,
    title: "Persistent AI Sidecar",
    body: "A pinned assistant can understand your current project, current table, current cell, and your internal help system.",
  },
  {
    icon: DatabaseZap,
    title: "Supabase Core",
    body: "Username/password auth, saved garages, project persistence, preferences, and future collaboration all fit naturally.",
  },
  {
    icon: Binary,
    title: "Strictly BIN Editing",
    body: "No flashing, no cable setup maze. Just XDF + BIN editing in a premium studio interface.",
  },
];

export default function HomePage() {
  return (
    <main className="landing-shell">
      <section className="hero-panel">
        <div className="hero-copy">
          <span className="eyebrow">BINFORGE</span>
          <h1>Build the badass BIN editor tuners actually want to use.</h1>
          <p>
            This product shell replaces clunky desktop-era calibration tooling with a sleek, animated, vehicle-aware studio for
            editing XDF-driven BIN tables and graph surfaces.
          </p>
          <div className="hero-actions">
            <Link className="button button-primary" href="/editor/project-atlas-e92">
              Open Editor Demo
              <ArrowRight size={16} />
            </Link>
            <Link className="button button-secondary" href="/dashboard">
              Open Garage
            </Link>
          </div>
        </div>
        <div className="hero-visual card-glass">
          <div className="editor-preview-toolbar">
            <span />
            <span />
            <span />
          </div>
          <div className="editor-preview-grid">
            <aside className="preview-sidebar">
              <p>Fueling</p>
              <p>Ignition</p>
              <p>Torque</p>
              <p>Lambda</p>
              <p>Limits</p>
            </aside>
            <div className="preview-table">
              {[...Array.from({ length: 5 })].map((_, row) => (
                <div className="preview-row" key={row}>
                  {[...Array.from({ length: 7 })].map((_, column) => (
                    <span key={column} />
                  ))}
                </div>
              ))}
            </div>
            <div className="preview-graph">
              <div className="preview-surface" />
            </div>
          </div>
        </div>
      </section>

      <section className="section-grid">
        {valueProps.map(({ icon: Icon, title, body }) => (
          <article className="card-glass feature-card" key={title}>
            <div className="feature-icon">
              <Icon size={18} />
            </div>
            <h2>{title}</h2>
            <p>{body}</p>
          </article>
        ))}
      </section>
    </main>
  );
}
