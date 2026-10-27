import { Link, Outlet, useNavigate } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";

export default function Layout() {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const canManageKallot = user?.role === "REP" || user?.role === "ADMIN";

  function handleLogout() {
    logout();
    navigate("/login", { replace: true });
  }

  return (
    <div>
      <nav>
        <span>
          שלום, {user?.name}
          {user?.className && ` (${user.className})`}
        </span>

        <Link to="/">דף הבית</Link>
        {canManageKallot && <Link to="/kallot/new">הוספת כלה</Link>}

        <button type="button" onClick={handleLogout}>
          יציאה
        </button>
      </nav>

      <main>
        <Outlet />
      </main>
    </div>
  );
}
