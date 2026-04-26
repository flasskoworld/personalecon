// Hustle Board — Debt Edit Modal
// Allows editing balance, paid amount, APR, min payment, and name
// Design: Dark Urban Fintech | matches main dashboard theme

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

export function DebtEditModal({ debt, onClose, onSave }: DebtEditModalProps) {
  const [name, setName] = useState("");
  const [balance, setBalance] = useState("");
  const [paid, setPaid] = useState("");
  const [apr, setApr] = useState("");
  const [minPayment, setMinPayment] = useState("");
  const [confirmReset, setConfirmReset] = useState(false);

  // Sync form when debt changes
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

    toast.success(`${name} updated successfully`);
    onClose();
  };

  const handleResetPaid = () => {
    setPaid("0.00");
    setConfirmReset(false);
    toast.info("Paid amount cleared — save to apply");
  };

  const interestPreview = (parseFloat(balance) || 0) * ((parseFloat(apr) || 0) / 100 / 12);

  return (
    <>
      {/* Backdrop */}
      <div
        className="fixed inset-0 z-40 bg-black/70 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
        <div
          className="w-full max-w-md rounded-2xl border border-white/10 bg-[#0f1015] shadow-2xl"
          style={{ boxShadow: `0 0 0 1px ${debt.color}22, 0 24px 64px rgba(0,0,0,0.7)` }}
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div
            className="flex items-center justify-between px-5 py-4 border-b border-white/8 rounded-t-2xl"
            style={{ background: `linear-gradient(135deg, ${debt.color}12 0%, transparent 100%)` }}
          >
            <div className="flex items-center gap-2">
              <div
                className="w-7 h-7 rounded-lg flex items-center justify-center"
                style={{ background: debt.color + "22", color: debt.color }}
              >
                <Pencil size={13} />
              </div>
              <div>
                <h2
                  className="text-sm font-bold text-white"
                  style={{ fontFamily: "'Syne', sans-serif" }}
                >
                  Edit Debt
                </h2>
                <p className="text-xs text-slate-500">Update balance, payments, or APR</p>
              </div>
            </div>
            <button
              onClick={onClose}
              className="w-7 h-7 rounded-lg flex items-center justify-center text-slate-400 hover:text-white hover:bg-white/8 transition-all"
            >
              <X size={15} />
            </button>
          </div>

          {/* Body */}
          <div className="px-5 py-4 space-y-4">
            {/* Name */}
            <div>
              <label className="text-xs text-slate-400 block mb-1.5">Debt Label</label>
              <input
                type="text"
                value={name}
                onChange={(e) => setName(e.target.value)}
                className="w-full bg-white/5 border border-white/10 rounded-lg px-3 py-2.5 text-sm text-white placeholder:text-slate-600 focus:outline-none focus:border-white/25 focus:ring-1 focus:ring-white/10 transition-all"
              />
            </div>

            {/* Balance + Paid side by side */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">
                  Current Balance
                  <span className="ml-1 text-slate-600">(after interest)</span>
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={balance}
                    onChange={(e) => setBalance(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg pl-7 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-rose-500/40 focus:ring-1 focus:ring-rose-500/20 transition-all"
                  />
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Was {formatCurrency(debt.balance)}
                </p>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1.5">
                  Total Paid So Far
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    value={paid}
                    onChange={(e) => setPaid(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg pl-7 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-emerald-500/40 focus:ring-1 focus:ring-emerald-500/20 transition-all"
                  />
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Was {formatCurrency(debt.paid)}
                </p>
              </div>
            </div>

            {/* APR + Min Payment side by side */}
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="text-xs text-slate-400 block mb-1.5">
                  APR (%)
                </label>
                <div className="relative">
                  <input
                    type="number"
                    min="0"
                    max="200"
                    step="0.01"
                    value={apr}
                    onChange={(e) => setApr(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg px-3 pr-7 py-2.5 text-sm text-white focus:outline-none focus:border-amber-500/40 focus:ring-1 focus:ring-amber-500/20 transition-all"
                  />
                  <span className="absolute right-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">%</span>
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Was {formatPercent(debt.apr)}
                </p>
              </div>

              <div>
                <label className="text-xs text-slate-400 block mb-1.5">
                  Min. Payment
                </label>
                <div className="relative">
                  <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 text-sm">$</span>
                  <input
                    type="number"
                    min="0"
                    step="1"
                    value={minPayment}
                    onChange={(e) => setMinPayment(e.target.value)}
                    className="w-full bg-white/5 border border-white/10 rounded-lg pl-7 pr-3 py-2.5 text-sm text-white focus:outline-none focus:border-white/25 focus:ring-1 focus:ring-white/10 transition-all"
                  />
                </div>
                <p className="text-xs text-slate-600 mt-1">
                  Was ${debt.minPayment}/mo
                </p>
              </div>
            </div>

            {/* Live interest preview */}
            {interestPreview > 0 && (
              <div className="rounded-lg bg-rose-500/8 border border-rose-500/15 px-3 py-2.5 flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <AlertTriangle size={13} className="text-rose-400 shrink-0" />
                  <span className="text-xs text-slate-400">Monthly interest at this balance</span>
                </div>
                <span className="text-xs font-mono font-bold text-rose-400">
                  ${interestPreview.toFixed(2)}/mo
                </span>
              </div>
            )}

            {/* Clear paid amount */}
            <div className="rounded-lg border border-white/8 bg-white/3 px-3 py-3">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-xs font-semibold text-slate-300">Clear Payment History</p>
                  <p className="text-xs text-slate-500 mt-0.5">Reset "Total Paid" to $0 if you need to start fresh</p>
                </div>
                {!confirmReset ? (
                  <button
                    onClick={() => setConfirmReset(true)}
                    className="flex items-center gap-1.5 text-xs text-slate-400 hover:text-amber-400 border border-white/10 hover:border-amber-500/30 rounded-lg px-3 py-1.5 transition-all"
                  >
                    <RotateCcw size={12} />
                    Clear
                  </button>
                ) : (
                  <div className="flex items-center gap-2">
                    <span className="text-xs text-amber-400">Sure?</span>
                    <button
                      onClick={handleResetPaid}
                      className="text-xs text-rose-400 hover:text-rose-300 font-semibold border border-rose-500/30 rounded-lg px-2 py-1 transition-all"
                    >
                      Yes
                    </button>
                    <button
                      onClick={() => setConfirmReset(false)}
                      className="text-xs text-slate-400 hover:text-slate-200"
                    >
                      No
                    </button>
                  </div>
                )}
              </div>
            </div>
          </div>

          {/* Footer */}
          <div className="flex items-center gap-3 px-5 py-4 border-t border-white/8">
            <button
              onClick={onClose}
              className="flex-1 py-2.5 rounded-lg text-sm font-semibold text-slate-400 hover:text-white border border-white/10 hover:border-white/20 transition-all"
            >
              Cancel
            </button>
            <button
              onClick={handleSave}
              className="flex-1 py-2.5 rounded-lg text-sm font-bold text-black flex items-center justify-center gap-2 transition-all hover:opacity-90 active:scale-95"
              style={{ background: debt.color }}
            >
              <Save size={14} />
              Save Changes
            </button>
          </div>
        </div>
      </div>
    </>
  );
}
