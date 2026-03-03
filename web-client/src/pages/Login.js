import { useNavigate } from "react-router-dom";

function Login() {
  const navigate = useNavigate();

  const handleLogin = () => {
    // later this will check backend
    navigate("/dashboard");
  };

  return (
    <div style={{ padding: "40px" }}>
      <h2>Login</h2>

      <div style={{ marginBottom: "15px" }}>
        <label>Username:</label>
        <br />
        <input type="text" placeholder="Enter username" />
      </div>

      <div style={{ marginBottom: "15px" }}>
        <label>Password:</label>
        <br />
        <input type="password" placeholder="Enter password" />
      </div>

      <button
        style={{ padding: "8px 16px" }}
        onClick={handleLogin}
      >
        Login
      </button>
    </div>
  );
}

export default Login;