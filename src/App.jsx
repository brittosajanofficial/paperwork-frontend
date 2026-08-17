import { useState } from "react";
import Login from "./Login";
import Signup from "./Signup";
import DocumentDashboard from "./DocumentDashboard";

function App() {
  const [auth, setAuth] = useState(null);
  const [showSignup, setShowSignup] = useState(false);

  if (!auth) {
    if (showSignup) {
      return (
        <Signup
          onSignedUp={() => setShowSignup(false)}
          onBackToLogin={() => setShowSignup(false)}
        />
      );
    }
    return <Login onLogin={setAuth} onGoToSignup={() => setShowSignup(true)} />;
  }
  return <DocumentDashboard token={auth.access} refreshToken={auth.refresh} onAuthChange={setAuth} />;
}

export default App;