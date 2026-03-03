import Navbar from "../components/Navbar";

function ATM() {
  return (
    <div>
      <Navbar />

      <div style={{ padding: "40px" }}>
        <h2>Find Nearby ATM</h2>

        <div style={{ marginBottom: "15px" }}>
          <label>Enter City or Zip Code:</label>
          <br />
          <input type="text" placeholder="e.g. San Jose, CA" />
        </div>

        <button>Search</button>

        <h3 style={{ marginTop: "30px" }}>Results:</h3>
        <ul>
          <li>123 MLK Lib, San Jose, CA</li>
        </ul>
      </div>
    </div>
  );
}

export default ATM;