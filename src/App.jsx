import { useState } from "react";
import Login from "./Login";
import DocumentDashboard from "./DocumentDashboard";

function App() {
  const [auth, setAuth] = useState(null);

  if (!auth) {
    return <Login onLogin={setAuth} />;
  }
  return <DocumentDashboard token={auth.access} refreshToken={auth.refresh} onAuthChange={setAuth} />;
}

export default App;