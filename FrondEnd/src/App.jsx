import { useAuth } from "./context/AuthContext";
import DashboardPage from "./pages/DashboardPage";
import LoginPage from "./pages/LoginPageOtp";

export default function App() {
  const { isAuthenticated } = useAuth();

  return isAuthenticated ? <DashboardPage /> : <LoginPage />;
}
