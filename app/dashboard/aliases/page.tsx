"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import toast from "react-hot-toast";

export default function ClearAliasesPage() {
  return (
    <section>
      <h3 className="text-lg font-semibold mb-4">Clear Aliases</h3>
      <div className="bg-white p-6 rounded shadow-sm">
        <AliasesManager />
      </div>
    </section>
  );
}

function AliasesManager() {
  const [aliases, setAliases] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [amounts, setAmounts] = useState<Record<number, string>>({});

  const load = async () => {
    setLoading(true);
    try {
      const res = await api.get("/aliases?only_active=true&limit=100");
      const data = (res as any).data ?? res;
      setAliases(Array.isArray(data) ? data : []);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const pay = async (aliasId: number) => {
    const amt = parseFloat(amounts[aliasId] || "0");
    if (!amt || amt <= 0) return toast.error("Enter a valid amount");
    try {
      await api.post(`/aliases/${aliasId}/installments`, { amount: amt });
      toast.success("Alias payment recorded");
      setAmounts((s) => ({ ...s, [aliasId]: "" }));
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || e?.message || "Failed");
    }
  };

  const clear = async (aliasId: number) => {
    try {
      await api.post(`/aliases/${aliasId}/clear`, {});
      toast.success("Alias cleared");
      await load();
    } catch (e: any) {
      toast.error(e?.response?.data?.detail || e?.message || "Failed");
    }
  };

  return (
    <div>
      {loading ? (
        <div className="text-sm text-gray-600">Loading aliases...</div>
      ) : aliases.length === 0 ? (
        <div className="text-sm text-gray-600">No active aliases</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 xl:grid-cols-3 gap-4">
          {aliases.map((a) => (
            <div key={a.id} className="p-4 border rounded-lg bg-white shadow-sm hover:shadow-md transition">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <div className="font-semibold text-gray-900">Alias #{a.id}</div>
                  <div className="mt-1 text-sm text-gray-600">Remaining: <span className="font-medium">KSh {a.remaining_amount}</span></div>
                  <div className="text-xs text-gray-500">Customer ID: {a.customer_id} · Loan ID: {a.loan_id}</div>
                </div>
                <span className={`text-xs h-fit px-2 py-1 rounded-full ${a.is_cleared ? 'bg-gray-100 text-gray-700' : 'bg-red-50 text-red-700'}`}>{a.is_cleared ? 'Cleared' : 'Active'}</span>
              </div>
              {!a.is_cleared && (
                <div className="mt-4 flex flex-col md:flex-row gap-2">
                  <input
                    type="number"
                    placeholder="Enter amount"
                    value={amounts[a.id] || ""}
                    onChange={(e) => setAmounts((s) => ({ ...s, [a.id]: e.target.value }))}
                    className="px-3 py-2 border rounded md:max-w-xs focus:outline-none focus:ring-2 focus:ring-green-500"
                  />
                  <div className="flex gap-2 w-full md:w-auto">
                    <button onClick={() => pay(a.id)} className="flex-1 md:flex-none px-4 py-2 bg-green-600 hover:bg-green-700 text-white rounded">Record Payment</button>
                    <button onClick={() => clear(a.id)} className="flex-1 md:flex-none px-4 py-2 bg-gray-800 hover:bg-gray-900 text-white rounded">Clear Alias</button>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
}


