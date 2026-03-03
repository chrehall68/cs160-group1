import Navbar from "../components/Navbar";

function Dashboard() {
  return (
    <div>
      <Navbar />

      <div style={{ padding: "40px" }}>
        <h2>Customer Dashboard</h2>

        <h3>Total Balance: $4,230.54</h3>

        <h4>Your Accounts:</h4>
        <ul>
          <li>Checking ••••1234 — $2,100.20</li>
          <li>Savings ••••8832 — $2,130.34</li>
        </ul>

        <h4>Recent Transactions:</h4>
        <ul>
          <li>Deposit +$500</li>
          <li>Withdrawal -$60</li>
          <li>Transfer -$800</li>
        </ul>
      </div>
    </div>
  );
}

export default Dashboard;