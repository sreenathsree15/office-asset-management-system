import { useAuth } from "../context/AuthContext";

export default function DashboardPage() {
  const { user, logout } = useAuth();

  return (
    <main className="dashboard-shell">
      <section className="dashboard-card dashboard-card-blank">
        <div className="dashboard-toolbar">
          <div>
            <p className="eyebrow">Dashboard</p>
            <h1>Asset Management</h1>
            <p className="dashboard-user">Signed in as {user?.username}</p>
          </div>

          <button className="secondary-button" type="button" onClick={logout}>
            Log out
          </button>
        </div>

        <div className="dashboard-empty-state" />
      </section>
    </main>
  );
}
