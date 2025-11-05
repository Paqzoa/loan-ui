"use client";

import React, { useState, useEffect } from "react";
import { api } from "@/lib/api";
import toast from "react-hot-toast";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";



function PayInstallmentForm() {
  const router = useRouter();
  const [idNumber, setIdNumber] = useState("");
  const [amount, setAmount] = useState("");
  const [loading, setLoading] = useState(false);
  const [customer, setCustomer] = useState<any | null>(null);
  // Check if customer has active (not overdue/arrears/completed) loans
  const hasPayableLoan = (cust: any | null) => {
    if (!cust || !Array.isArray(cust.loans)) return false;
    return cust.loans.some((l: any) => {
      const status = (l.status || '').toLowerCase();
      return status === 'active'; // Only ACTIVE loans can be paid here
    });
  };

  // Check if customer has overdue or arrears loans
  const hasOverdueOrArrearsLoan = (cust: any | null) => {
    if (!cust || !Array.isArray(cust.loans)) return false;
    return cust.loans.some((l: any) => {
      const status = (l.status || '').toLowerCase();
      return status === 'overdue' || status === 'arrears';
    });
  };

  const lookup = async () => {
    if (!idNumber) return;
    setLoading(true);
    try {
      const res = await api.get(`/customers/by-id-number/${encodeURIComponent(idNumber)}`);
      const data = (res as any).data ?? res;
      setCustomer(data);
    } catch (e: any) {
      setCustomer(null);
      toast.error(e?.response?.data?.detail || 'Customer not found');
    } finally {
      setLoading(false);
    }
  };

  const handlePay = async (loanId?: number) => {
    if (!idNumber || !amount) return;
    setLoading(true);
    try {
      await api.post('/payments', { id_number: idNumber, amount: parseFloat(amount) });
      toast.success('Payment recorded');
      setAmount("");

      router.push("/dashboard");
     
      await lookup();
    } catch (e: any) {
      const msg = e?.message || e?.response?.data?.detail || 'Failed to record payment';
      toast.error(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-3xl">
      <div className="flex flex-col md:flex-row gap-3">
        <div className="flex-1">
          <label className="block text-sm font-medium text-gray-700">Customer ID Number</label>
          <input value={idNumber} onChange={(e) => setIdNumber(e.target.value)} className="w-full px-3 py-2 border rounded mt-1" />
        </div>
        <button onClick={lookup} disabled={loading || !idNumber} className="px-4 py-2 bg-green-600 text-white rounded self-end">{loading ? 'Searching...' : 'Search'}</button>
      </div>

      {customer && (
        <div className="mt-6">
          <div className="p-4 border rounded-lg">
            <div className="font-semibold">{customer.name} <span className="text-xs text-gray-500">({customer.id_number})</span></div>
            <div className="text-sm text-gray-600">{customer.phone}{customer.email ? ` · ${customer.email}` : ''}</div>
          </div>

          <div className="mt-4 p-4 border rounded-lg">
            <div className="font-semibold mb-2">Loans</div>
            {(customer.loans || []).length === 0 ? (
              <div className="text-sm text-gray-600">No loans found</div>
            ) : (
              <div className="space-y-3">
                {(customer.loans || []).map((l: any) => {
                  const status = (l.status || '').toLowerCase();
                  const isOverdueOrArrears = status === 'overdue' || status === 'arrears';
                  return (
                    <div key={l.id} className={`p-3 border rounded ${isOverdueOrArrears ? 'bg-yellow-50 border-yellow-200' : ''}`}>
                      <div className="flex items-center justify-between">
                        <div className="font-medium">KSh {l.amount}</div>
                        <span className={`text-xs px-2 py-1 rounded-full ${
                          status === 'completed' ? 'bg-gray-100 text-gray-700' : 
                          isOverdueOrArrears ? 'bg-yellow-100 text-yellow-700' : 
                          'bg-green-50 text-green-700'
                        }`}>{l.status}</span>
                      </div>
                      <div className="mt-1 text-xs text-gray-600">Interest: {l.interest_rate}% · Start: {l.start_date} · Due: {l.due_date}</div>
                      <div className="mt-1 text-xs text-gray-600">Remaining Amount: KSh {l.remaining_amount}</div>
                      {isOverdueOrArrears && (
                        <div className="mt-2 text-xs text-yellow-700 font-medium">
                          ⚠️ This loan must be paid through the Arrears page
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>
            )}
            {hasPayableLoan(customer) ? (
              <div className="mt-4 max-w-sm">
                <label className="block text-sm font-medium text-gray-700">Installment Amount</label>
                <input type="number" value={amount} onChange={(e) => setAmount(e.target.value)} className="w-full px-3 py-2 border rounded mt-1 mb-3" />
                <button onClick={() => handlePay()} disabled={loading || !amount} className="px-4 py-2 bg-green-600 text-white rounded">Record Payment</button>
              </div>
            ) : hasOverdueOrArrearsLoan(customer) ? (
              <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded-lg">
                <div className="text-sm text-yellow-800 font-medium mb-1">⚠️ Overdue/Arrears Loan Detected</div>
                <div className="text-xs text-yellow-700">
                  Loans that are overdue or in arrears must be paid through the <span className="font-semibold">Arrears</span> page, not here.
                </div>
              </div>
            ) : (
              <div className="mt-4 text-sm text-gray-600">All loans are completed. No further installments can be recorded.</div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}

export default function PayInstallmentsPage() {
  const { loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();

  // Auth guard: redirect to login if session expired
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  // Show loading while checking auth
  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  // Don't render if not authenticated (will redirect)
  if (!isAuthenticated) {
    return null;
  }

  return (
    <section>
      <h3 className="text-lg font-semibold mb-4">Pay Installment</h3>
      <div className="bg-white p-6 rounded shadow-sm">
        <PayInstallmentForm />
      </div>
    </section>
  );
}
