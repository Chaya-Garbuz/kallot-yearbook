import { Navigate, Outlet } from "react-router-dom";
import { useAuth } from "../hooks/useAuth";
import Loading from "./loading";

export default function GuestRoute() {
  const { user, isLoading } = useAuth();

  if (isLoading) {
    return <Loading/>;
  }

  if (user) {
    return <Navigate to="/" replace />;
  }

  return <Outlet />;
}