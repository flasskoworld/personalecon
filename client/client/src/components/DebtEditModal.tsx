// Personal Economy — Debt Edit Modal
// Design: SE HQ Sovereign Dark Theme
// Type:   Syne (heading) · Space Mono (labels) · Inter (inputs)
// Accent: Gold borders/focus, debt.color save button (unchanged)

import { useState, useEffect } from "react";
import { Debt, formatCurrency, formatPercent } from "@/lib/financialData";
import { X, AlertTriangle, RotateCcw, Save, Pencil } from "lucide-react";
import { toast } from "sonner";

interface DebtEditModalProps {
  debt: Debt | null;
  onClose: () => void;
  onSave: (
    debtId: string,
    fields: Partial<Pick<Debt, "balance" | "paid" | "apr" | "minPayment" | "name">>
  ) => void;
}

// Shared input styles — gold focus ring
const inputBase: React.CSSProperties = {
  width: "100%",
  background: "rgba(255,255,255,0.04)",
  border: "1px solid rgba(255,255,255,0.08)",
  padding: "10px 12px",
  fontSize: "13px",
  color: "#F0EDE4",
  outline: "none",
  fontFamily: "'Inter', sans-serif",
  transition: "border-color 0.2s",
};

const labelStyle: React.CSSProperties = {
  display: "block",
  fontFamily: "'Space Mono', monospace",
  fontSize: "8px",
  letterSpacing: "0.18em",
  textTransform: "uppercase" as const,
  color: "#4A505E",
  marginBottom: "6px",
};

const subTextStyle: React.CSSProperties = {
  fontFamily: "'Space Mono', monospace",
  fontSize: "8px",
  color: "#2E3340",
  marginTop: "4px",
  letterSpacing: "0.05em",
};

export function DebtEditModal({ debt, onClose, onSave }: DebtEditModalProps) {
  const [name, setName] = useState("");
  const [balance, setBalance] = useState("");
  const [paid, setPaid] = useState("");
  const [apr, setApr] = useState("");
  const [minPayment, setMinPayment] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);

  useEffect(() => {
    if (debt) {
      setName(debt.name);
      setBalance(debt.balance.toFixed(2));
      setPaid(debt.paid.toFixed(2));
      setApr((debt.apr * 100).toFixed(2));
      setMinPayment(debt.minPayment.toString());
      setConfirmReset(false);
    }
  }, [debt]);

  if (!debt) return null;

  const handleSave = () => {
    const newBalance = parseFloat(balance);
    const newPaid = parseFloat(paid);
    const newApr = parseFloat(apr) / 100;
    const newMin = parseFloat(minPayment);

    if (isNaN(newBalance) || newBalance < 0) {
      toast.error("Balance must be a valid number (0 or more)");
      return;
    }
    if (isNaN(newPaid) || newPaid < 0) {
      toast.error("Amount paid must be a valid number");
      return;
    }
    if (isNaN(newApr) || newApr < 0 || newApr > 2) {
      toast.error("APR must be between 0% and 200%");
      return;
    }
    if (isNaN(newMin) || newMin < 0) {
      toast.error("Minimum payment must be a valid number");
      return;
    }
    if (!name.trim()) {
      toast.error("Debt name cannot be empty");
      return;
    }

    onSave(debt.id, {
      name: name.trim(),
      balance: newBalance,
      paid: newPaid,
      apr: newApr,
      minPayment: newMin,
    });

    toast.success(`${name} updated`);
    onClose();
  };

  const handleResetPaid = () => {
    setPaid("0.00");
    setConfirmReset(false);
    toast.info("Paid amount cleared — save to apply");
  };

  const interestPreview =
    (parseFloat(balance) || 0) * ((parseFloat(apr) || 0) / 100 / 12);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40"
        style={{ background: "rgba(0,0,0,0.75)", backdropFilter: "blur(10px)" }}
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          style={{
            width: "100%",
            maxWidth: "440px",
            background: "#0B0E16",
            border: "1px solid rgba(201,168,76,0.20)",
            boxShadow: `0 0 0 1px ${debt.color}18, 0 32px 80px rgba(0,0,0,0.8)`,
            position: "relative",
            overflow: "hidden",
          }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Gold top-bar accent */}
          <div
            style={{
              position: "absolute",
              top: 0, left: 0, right: 0,
              height: "2px",
              background: `linear-gradient(90deg, ${debt.color}, transparent 70%)`,
            }}
          />

          {/* Header */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              padding: "18px 20px 16px",
              borderBottom: "1px solid rgba(255,255,255,0.06)",
              background: `linear-gradient(135deg, ${debt.color}08 0%, transparent 100%)`,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
              {/* Icon square */}
              <div
                style={{
                  width: "28px",
                  height: "28px",
                  border: `1px solid ${debt.color}30`,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  color: debt.color,
                }}
              >
                <Pencil size={12} />
              </div>
              <div>
                <h2
                  style={{
                    fontFamily: "'Syne', sans-serif",
                    fontSize: "14px",
                    fontWeight: "800",
                    color: "#F0EDE4",
                    letterSpacing: "-0.01em",
                  }}
                >
                  Edit Debt
                </h2>
                <p style={{ fontFamily: "'Space Mono', monospace", fontSize: "8px", color: "#4A505E", letterSpacing: "0.1em", textTransform: "uppercase" }}>
                  Update balance · payments · APR
                </p>
              </div>
            </div>

            <button
              onClick={onClose}
              style={{
                width: "28px",
                height: "28px",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                border: "1px solid rgba(255,255,255,0.08)",
                background: "none",
                color: "#7A8090",
                cursor: "pointer",
                transition: "color 0.2s, border-color 0.2s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = "#F0EDE4";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.15)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = "#7A8090";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.08)";
              }}
            >
              <X size={14} />
            </button>
          </div>

          {/* Body */}
          <div style={{ padding: "18px 20px", display: "flex", flexDirection: "column", gap: "16px" }}>

            {/* Debt name */}
            <div>
              <label style={labelStyle}>Debt Label</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                style={inputBase}
                onFocus={(e) => ((e.target as HTMLInputElement).style.borderColor = "rgba(201,168,76,0.4)")}
                onBlur={(e) => ((e.target as HTMLInputElement).style.borderColor = "rgba(255,255,255,0.08)")}
              />
            </div>

            {/* Balance + Paid */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={labelStyle}>
                  Current Balance
                  <span style={{ color: "#2E3340", marginLeft: "4px" }}>(after interest)</span>
                </label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#7A8090", fontSize: "13px" }}>$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={balance}
                    onChange={(e) => setBalance(e.target.value)}
                    style={{ ...inputBase, paddingLeft: "24px" }}
                    onFocus={(e) => ((e.target as HTMLInputElement).style.borderColor = "rgba(224,82,82,0.4)")}
                    onBlur={(e) => ((e.target as HTMLInputElement).style.borderColor = "rgba(255,255,255,0.08)")}
                  />
                </div>
                <p style={subTextStyle}>Was {formatCurrency(debt.balance)}</p>
              </div>

              <div>
                <label style={labelStyle}>Total Paid So Far</label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#7A8090", fontSize: "13px" }}>$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={paid}
                    onChange={(e) => setPaid(e.target.value)}
                    style={{ ...inputBase, paddingLeft: "24px" }}
                    onFocus={(e) => ((e.target as HTMLInputElement).style.borderColor = "rgba(45,212,191,0.4)")}
                    onBlur={(e) => ((e.target as HTMLInputElement).style.borderColor = "rgba(255,255,255,0.08)")}
                  />
                </div>
                <p style={subTextStyle}>Was {formatCurrency(debt.paid)}</p>
              </div>
            </div>

            {/* APR + Min Payment */}
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
              <div>
                <label style={labelStyle}>APR (%)</label>
                <div style={{ position: "relative" }}>
                  <input
                    type="number"
                    min="0"
                    max="200"
                    step="0.01"
                    value={apr}
                    onChange={(e) => setApr(e.target.value)}
                    style={{ ...inputBase, paddingRight: "28px" }}
                    onFocus={(e) => ((e.target as HTMLInputElement).style.borderColor = "rgba(201,168,76,0.4)")}
                    onBlur={(e) => ((e.target as HTMLInputElement).style.borderColor = "rgba(255,255,255,0.08)")}
                  />
                  <span style={{ position: "absolute", right: "12px", top: "50%", transform: "translateY(-50%)", color: "#7A8090", fontSize: "13px" }}>%</span>
                </div>
                <p style={subTextStyle}>Was {formatPercent(debt.apr)}</p>
              </div>

              <div>
                <label style={labelStyle}>Min. Payment</label>
                <div style={{ position: "relative" }}>
                  <span style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#7A8090", fontSize: "13px" }}>$</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={minPayment}
                    onChange={(e) => setMinPayment(e.target.value)}
                    style={{ ...inputBase, paddingLeft: "24px" }}
                    onFocus={(e) => ((e.target as HTMLInputElement).style.borderColor = "rgba(201,168,76,0.4)")}
                    onBlur={(e) => ((e.target as HTMLInputElement).style.borderColor = "rgba(255,255,255,0.08)")}
                  />
                </div>
                <p style={subTextStyle}>Was ${debt.minPayment}/mo</p>
              </div>
            </div>

            {/* Interest preview */}
            {interestPreview > 0 && (
              <div
                style={{
                  background: "rgba(224,82,82,0.06)",
                  border: "1px solid rgba(224,82,82,0.15)",
                  padding: "10px 14px",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <AlertTriangle size={12} style={{ color: "#E05252", flexShrink: 0 }} />
                  <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "9px", color: "#7A8090", letterSpacing: "0.08em" }}>
                    Monthly interest at this balance
                  </span>
                </div>
                <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "11px", fontWeight: "700", color: "#E05252" }}>
                  ${interestPreview.toFixed(2)}/mo
                </span>
              </div>
            )}

            {/* Clear paid history */}
            <div
              style={{
                border: "1px solid rgba(255,255,255,0.06)",
                background: "rgba(255,255,255,0.02)",
                padding: "12px 14px",
                display: "flex",
                alignItems: "center",
                justifyContent: "space-between",
                gap: "12px",
              }}
            >
              <div>
                <p style={{ fontFamily: "'Syne', sans-serif", fontSize: "12px", fontWeight: "700", color: "#F0EDE4", marginBottom: "2px" }}>
                  Clear Payment History
                </p>
                <p style={{ fontFamily: "'Space Mono', monospace", fontSize: "8px", color: "#4A505E", letterSpacing: "0.06em" }}>
                  Reset "Total Paid" to $0 to start fresh
                </p>
              </div>

              {!confirmReset ? (
                <button
                  onClick={() => setConfirmReset(true)}
                  style={{
                    fontFamily: "'Space Mono', monospace",
                    fontSize: "9px",
                    letterSpacing: "0.08em",
                    textTransform: "uppercase",
                    color: "#7A8090",
                    background: "none",
                    border: "1px solid rgba(255,255,255,0.08)",
                    padding: "6px 12px",
                    cursor: "pointer",
                    display: "flex",
                    alignItems: "center",
                    gap: "6px",
                    transition: "color 0.2s, border-color 0.2s",
                    flexShrink: 0,
                  }}
                  onMouseEnter={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.color = "#C9A84C";
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(201,168,76,0.3)";
                  }}
                  onMouseLeave={(e) => {
                    (e.currentTarget as HTMLButtonElement).style.color = "#7A8090";
                    (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.08)";
                  }}
                >
                  <RotateCcw size={11} />
                  Clear
                </button>
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: "8px", flexShrink: 0 }}>
                  <span style={{ fontFamily: "'Space Mono', monospace", fontSize: "9px", color: "#C9A84C" }}>Sure?</span>
                  <button
                    onClick={handleResetPaid}
                    style={{
                      fontFamily: "'Space Mono', monospace",
                      fontSize: "9px",
                      color: "#E05252",
                      background: "none",
                      border: "1px solid rgba(224,82,82,0.3)",
                      padding: "4px 10px",
                      cursor: "pointer",
                    }}
                  >
                    Yes
                  </button>
                  <button
                    onClick={() => setConfirmReset(false)}
                    style={{
                      fontFamily: "'Space Mono', monospace",
                      fontSize: "9px",
                      color: "#7A8090",
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                    }}
                  >
                    No
                  </button>
                </div>
              )}
            </div>
          </div>

          {/* Footer */}
          <div
            style={{
              display: "flex",
              gap: "10px",
              padding: "14px 20px 20px",
              borderTop: "1px solid rgba(255,255,255,0.06)",
            }}
          >
            <button
              onClick={onClose}
              style={{
                flex: 1,
                padding: "11px",
                fontFamily: "'Space Mono', monospace",
                fontSize: "10px",
                fontWeight: "400",
                letterSpacing: "0.10em",
                textTransform: "uppercase",
                color: "#7A8090",
                background: "none",
                border: "1px solid rgba(255,255,255,0.08)",
                cursor: "pointer",
                transition: "color 0.2s, border-color 0.2s",
              }}
              onMouseEnter={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = "#F0EDE4";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.16)";
              }}
              onMouseLeave={(e) => {
                (e.currentTarget as HTMLButtonElement).style.color = "#7A8090";
                (e.currentTarget as HTMLButtonElement).style.borderColor = "rgba(255,255,255,0.08)";
              }}
            >
              Cancel
            </button>

            <button
              onClick={handleSave}
              style={{
                flex: 1,
                padding: "11px",
                fontFamily: "'Space Mono', monospace",
                fontSize: "10px",
                fontWeight: "700",
                letterSpacing: "0.10em",
                textTransform: "uppercase",
                color: "#06080E",
                background: debt.color,       // keeps debt.color — intentional, matches debt identity
                border: "none",
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: "7px",
                transition: "opacity 0.2s",
              }}
              onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "0.88")}
              onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.opacity = "1")}
            >
              <Save size={13} />
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
