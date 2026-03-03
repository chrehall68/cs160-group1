import Navbar from "../components/Navbar";

function Accounts() {
  return (
    <div>
      <Navbar />

      <div style={{ padding: "40px" }}>
        <h2>Your Accounts</h2>

        <div>
          <h4>Checking Account</h4>
          <p>Account Number: ••••1234</p>
          <p>Balance: $2,100.20</p>
          <p>Status: Active</p>
        </div>

        <br />

        <div>
          <h4>Savings Account</h4>
          <p>Account Number: ••••8832</p>
          <p>Balance: $2,130.34</p>
          <p>Status: Active</p>
        </div>
      </div>
    </div>
  );
}

export default Accounts;