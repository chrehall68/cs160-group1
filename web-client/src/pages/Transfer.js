import Navbar from "../components/Navbar";

function Transfer() {
  return (
    <div>
      <Navbar />

      <div style={{ padding: "40px" }}>
        <h2>Transfer Money</h2>

        <div style={{ marginBottom: "15px" }}>
          <label>From Account:</label>
          <br />
          <select>
            <option>Checking ••••1234</option>
            <option>Savings ••••8832</option>
          </select>
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label>To Account Number:</label>
          <br />
          <input type="text" placeholder="Enter account number" />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label>Routing Number:</label>
          <br />
          <input type="text" placeholder="Enter routing number" />
        </div>

        <div style={{ marginBottom: "15px" }}>
          <label>Amount:</label>
          <br />
          <input type="number" placeholder="$0.00" />
        </div>

        <button>Submit Transfer</button>
      </div>
    </div>
  );
}

export default Transfer;