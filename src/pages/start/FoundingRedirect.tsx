import { Navigate, useLocation } from "react-router-dom";
import { foundingRedirect } from "./campaign";

export function FoundingRedirect() {
  const { search } = useLocation();
  return <Navigate to={foundingRedirect(search)} replace />;
}
