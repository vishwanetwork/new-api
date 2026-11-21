import { useState } from "react";
import { Bell, Check } from "lucide-react";
import { useCommerce, currentCustomer, updateSettings } from "./commerce";

export function CustomerNotifications() {
  const state = useCommerce();
  const [amount, setAmount] = useState(String(state.settings.lowBalanceCents / 100));
  const [enabled, setEnabled] = useState(state.settings.emailAlerts);
  const [message, setMessage] = useState("");
  function save(event: React.FormEvent) {
    event.preventDefault();
    const value = Number(amount);
    if (!Number.isFinite(value) || value < 0) {
      setMessage("Enter a valid threshold.");
      return;
    }
    updateSettings({ lowBalanceCents: Math.round(value * 100), emailAlerts: enabled });
    setMessage(
      "Preferences saved. Email delivery will start when the account service is connected.",
    );
  }
  return (
    <form className="cw-panel cw-form" onSubmit={save}>
      <div className="cw-panel-title">
        <h2>
          <Bell size={18} /> Notifications
        </h2>
        <p>Choose when your workspace needs attention.</p>
      </div>
      <label className="cw-checkbox">
        <input type="checkbox" checked={enabled} onChange={(e) => setEnabled(e.target.checked)} />
        <span>Low balance alerts</span>
      </label>
      <label>
        Notify below (USD)
        <input
          type="number"
          min="0"
          step="0.01"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
      </label>
      <label>
        Send to
        <input type="email" readOnly value={currentCustomer(state).email} />
      </label>
      <div className="cw-inline-panel">
        <span>Delivery status</span>
        <span className="cw-badge">Email service offline</span>
      </div>
      <button className="cw-button cw-primary" type="submit">
        <Check size={16} /> Save preferences
      </button>
      {message && (
        <p className="cw-feedback" role="status">
          {message}
        </p>
      )}
    </form>
  );
}
