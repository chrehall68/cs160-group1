import { Link } from "react-router-dom";

function Navbar() {
  return (
    <div style={styles.navbar}>
      <h3 style={styles.logo}>Online Bank</h3>

      <div style={styles.links}>
        <Link to="/dashboard" style={styles.link}>Dashboard</Link>
        <Link to="/accounts" style={styles.link}>Accounts</Link>
        <Link to="/transfer" style={styles.link}>Transfer</Link>
        <Link to="/atm" style={styles.link}>ATM Locator</Link>
      </div>
    </div>
  );
}

const styles = {
  navbar: {
    display: "flex",
    justifyContent: "space-between",
    alignItems: "center",
    padding: "15px 30px",
    backgroundColor: "#0a1f44",
    color: "white"
  },
  logo: {
    margin: 0
  },
  links: {
    display: "flex",
    gap: "20px"
  },
  link: {
    color: "white",
    textDecoration: "none",
    fontWeight: "500"
  }
};

export default Navbar;