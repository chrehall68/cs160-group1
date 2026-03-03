import Navbar from "../components/Navbar";

function ManagerDashboard() {
  return (
    <div>
      <Navbar />

      <div style={{ padding: "40px" }}>
        <h2>Manager Dashboard</h2>

        <h3>Today's Statistics</h3>
        <ul>
          <li>Total Transactions: 134</li>
          <li>Total Deposits: $52,000</li>
          <li>Total Withdrawals: $18,400</li>
          <li>Total Transfers: $33,600</li>
        </ul>

        <h3 style={{ marginTop: "30px" }}>Filter Transactions</h3>

        <div style={{ marginBottom: "10px" }}>
          <label>Start Date:</label>
          <br />
          <input type="date" />
        </div>

        <div style={{ marginBottom: "10px" }}>
          <label>End Date:</label>
          <br />
          <input type="date" />
        </div>

        <div style={{ marginBottom: "10px" }}>
          <label>Minimum Amount:</label>
          <br />
          <input type="number" placeholder="$0.00" />
        </div>

        <button>Apply Filters</button>

        <h3 style={{ marginTop: "30px" }}>Recent Bank Transactions</h3>
        <table border="1" cellPadding="8">
          <thead>
            <tr>
              <th>Date</th>
              <th>Type</th>
              <th>Amount</th>
              <th>Zip Code</th>
            </tr>
          </thead>
          <tbody>
            <tr>
              <td>03/02</td>
              <td>Deposit</td>
              <td>$500</td>
              <td>95112</td>
            </tr>
            <tr>
              <td>03/01</td>
              <td>Transfer</td>
              <td>$800</td>
              <td>94087</td>
            </tr>
            <tr>
              <td>02/28</td>
              <td>Withdrawal</td>
              <td>$60</td>
              <td>95050</td>
            </tr>
          </tbody>
        </table>
      </div>
    </div>
  );
}

export default ManagerDashboard;