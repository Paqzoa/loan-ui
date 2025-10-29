"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/lib/auth";
import { api } from "@/lib/api";
import toast from "react-hot-toast";

interface Customer {
  name: string;
  id_number: string;
  phone: string;
  email?: string;
  location?: string;
}

interface CustomerCheckResponse {
  exists: boolean;
  has_active_loan: boolean;
  has_active_alias: boolean;
  customer: (Customer & { id: number; }) | null;
}

export default function AddLoanForm() {
  const { isAuthenticated, isLoading } = useAuth();
  const router = useRouter();

  const [customerIdNumber, setCustomerIdNumber] = useState("");
  const [lookupStatus, setLookupStatus] = useState<"idle" | "loading" | "success" | "error">("idle");
  const [customerExists, setCustomerExists] = useState(false);

  const [customerForm, setCustomerForm] = useState<Customer>({
    name: "",
    id_number: "",
    phone: "",
    email: "",
    location: "",
  });

  const [loanForm, setLoanForm] = useState({
    amount: "",
    interest_rate: "",
    start_date: new Date().toISOString().split("T")[0],
  });

  const [hasActiveLoan, setHasActiveLoan] = useState(false);
  const [hasActiveAlias, setHasActiveAlias] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [existingLoans, setExistingLoans] = useState<any[]>([]);
  const [existingAliases, setExistingAliases] = useState<any[]>([]);

  useEffect(() => {
    if (!isLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [isAuthenticated, isLoading, router]);

  const handleLookup = async () => {
    if (!customerIdNumber) {
      toast.error("Please enter ID Number");
      return;
    }
    setLookupStatus("loading");
    try {
      const data = await api.post<CustomerCheckResponse>("/customers/check", { id_number: customerIdNumber });
    //   setHasActiveLoan(data.has_active_loan);
    //   setHasActiveAlias(data.has_active_alias);
      if (data.exists && data.customer) {
        setCustomerExists(true);
        setCustomerForm({
          name: data.customer.name,
          id_number: data.customer.id_number,
          phone: data.customer.phone,
          email: data.customer.email || "",
          location: (data.customer as any).location || "",
        });
        toast.success("Customer found and loaded");
        // Load detailed loans/aliases for conditional UI display
        try {
          const detail = await api.get(`/customers/by-id-number/${encodeURIComponent(data.customer.id_number)}`);
          const d = (detail as any).data ?? detail;
          if(d.loans.length > 0) {
            setHasActiveLoan(true);
          }
          if(d.aliases.length > 0) {
            setHasActiveAlias(true);
          }
        } catch (_) {}
      } else {
        setCustomerExists(false);
        setCustomerForm({ name: "", id_number: "", phone: "", email: "", location: "" });
        toast("Customer not found. Please add new customer details.");
        setExistingLoans([]);
        setExistingAliases([]);
      }
      setLookupStatus("success");
    } catch (error: any) {
      const message = error?.message || error?.response?.data?.detail || "Something went wrong while checking customer";
      toast.error(message);
      setLookupStatus("error");
    }
  };

  const handleCustomerChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setCustomerForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleLoanChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const { name, value } = e.target;
    setLoanForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (hasActiveLoan || hasActiveAlias) {
      toast.error("Customer has active loans or aliases that must be cleared first");
      return;
    }
    setIsSubmitting(true);
    try {
      if (!customerExists) {
        if (!customerForm.id_number) {
          toast.error("ID Number is required for new customers");
          setIsSubmitting(false);
          return;
        }
        await api.post<{ id: number }>("/customers", customerForm);
      }
      await api.post("/loans", {
        id_number: customerForm.id_number,
        amount: parseFloat(loanForm.amount),
        interest_rate: parseFloat(loanForm.interest_rate),
        start_date: loanForm.start_date,
      });
      toast.success("Loan created successfully");
      router.push("/dashboard");
    } catch (error: any) {
      const message = error?.message || error?.response?.data?.detail || "Failed to create loan";
      toast.error(message);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-4">
      <h1 className="text-2xl font-bold mb-6">Add New Loan</h1>
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-xl font-semibold mb-4">Customer Lookup</h2>
        <div className="flex items-end gap-4">
          <div className="w-full md:w-1/2">
            <label htmlFor="customerIdNumber" className="block text-sm font-medium text-gray-700 mb-1">ID Number</label>
            <input type="text" id="customerIdNumber" value={customerIdNumber} onChange={(e) => setCustomerIdNumber(e.target.value)} className="w-full px-4 py-3 border border-gray-300 rounded-lg text-black focus:ring-4 focus:ring-green-200 focus:border-green-500 shadow-sm" placeholder="Enter ID number" />
          </div>
          <button type="button" onClick={handleLookup} disabled={lookupStatus === "loading"} className="px-4 py-2 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50">
            {lookupStatus === "loading" ? "Searching..." : "Search"}
          </button>
        </div>
      </div>

      {lookupStatus === "success" && (
        <form onSubmit={handleSubmit}>
          <div className="bg-white rounded-lg shadow-md p-6 mb-6">
            <h2 className="text-xl font-semibold mb-4">{customerExists ? "Customer Information" : "New Customer Information"}</h2>
            {(hasActiveLoan || hasActiveAlias) && (
              <div className="mb-4 p-4 bg-red-100 text-red-700 rounded-md">
                <p className="font-medium">Warning:</p>
                <ul className="list-disc list-inside">
                  {hasActiveLoan && (<li>Customer has an active loan that must be cleared first</li>)}
                  {hasActiveAlias && (<li>Customer has an active alias that must be cleared first</li>)}
                </ul>
              </div>
            )}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label htmlFor="name" className="block text-sm font-medium text-gray-700 mb-1">Full Name</label>
                <input type="text" id="name" name="name" value={customerForm.name} onChange={handleCustomerChange} className="w-full px-4 py-2 border border-gray-300 rounded-md text-black focus:ring-green-500 focus:border-green-500" placeholder="Enter full name" required readOnly={customerExists} />
              </div>
              <div>
                <label htmlFor="id_number" className="block text-sm font-medium text-gray-700 mb-1">ID Number</label>
                <input type="text" id="id_number" name="id_number" value={customerForm.id_number} onChange={handleCustomerChange} className="w-full px-4 py-2 border border-gray-300 rounded-md text-black focus:ring-green-500 focus:border-green-500" placeholder="Enter ID number" required readOnly={customerExists} />
              </div>
              <div>
                <label htmlFor="phone" className="block text-sm font-medium text-gray-700 mb-1">Phone Number</label>
                <input type="tel" id="phone" name="phone" value={customerForm.phone} onChange={handleCustomerChange} className="w-full px-4 py-2 border border-gray-300 rounded-md text-black focus:ring-green-500 focus:border-green-500" placeholder="Enter phone number" required readOnly={customerExists} />
              </div>
              <div>
                <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1">Email Address</label>
                <input type="email" id="email" name="email" value={customerForm.email} onChange={handleCustomerChange} className="w-full px-4 py-2 border border-gray-300 rounded-md text-black focus:ring-green-500 focus:border-green-500" placeholder="Enter email address (optional)" readOnly={customerExists} />
              </div>
              <div>
                <label htmlFor="location" className="block text-sm font-medium text-gray-700 mb-1">Location</label>
                <input type="text" id="location" name="location" value={customerForm.location} onChange={handleCustomerChange} className="w-full px-4 py-2 border border-gray-300 rounded-md text-black focus:ring-green-500 focus:border-green-500" placeholder="Enter location" required readOnly={customerExists} />
              </div>
            </div>
          </div>

          {(hasActiveLoan || hasActiveAlias) ? (
            <>
              <div className="p-4 rounded-md bg-red-50 border border-red-200 text-red-700">
                This customer has an existing active loan or alias and cannot be issued another loan.
              </div>
              {/* Existing details for context */}
              <div className="mt-4 grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="p-4 border rounded-lg">
                  <div className="font-semibold mb-2">Existing Loans</div>
                  {existingLoans.length === 0 ? (
                    <div className="text-sm text-gray-600">No loans</div>
                  ) : (
                    <ul className="space-y-2 text-sm">
                      {existingLoans.map((l: any) => (
                        <li key={l.id} className="p-3 border rounded">
                          <div className="flex items-center justify-between">
                            <div className="font-medium">KSh {l.amount}</div>
                            <span className={`text-xs px-2 py-1 rounded-full ${(l.status||'').toLowerCase()==='completed' ? 'bg-gray-100 text-gray-700' : 'bg-green-50 text-green-700'}`}>{l.status}</span>
                          </div>
                          <div className="mt-1 text-xs text-gray-600">Start: {l.start_date} · Due: {l.due_date}</div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
                <div className="p-4 border rounded-lg">
                  <div className="font-semibold mb-2">Aliases</div>
                  {existingAliases.length === 0 ? (
                    <div className="text-sm text-gray-600">No aliases</div>
                  ) : (
                    <ul className="space-y-2 text-sm">
                      {existingAliases.map((a: any) => (
                        <li key={a.id} className="p-3 border rounded">
                          <div className="flex items-center justify-between">
                            <div className="font-medium">Remaining: KSh {a.remaining_amount}</div>
                            <span className={`text-xs px-2 py-1 rounded-full ${a.is_cleared ? 'bg-gray-100 text-gray-700' : 'bg-red-50 text-red-700'}`}>{a.is_cleared ? 'Cleared' : 'Active'}</span>
                          </div>
                          <div className="mt-1 text-xs text-gray-600">Alias date: {a.alias_date}</div>
                        </li>
                      ))}
                    </ul>
                  )}
                </div>
              </div>
            </>
          ) : (
            <>
              <div className="bg-white rounded-lg shadow-md p-6 mb-6">
                <h2 className="text-xl font-semibold mb-4">Loan Information</h2>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="amount" className="block text-sm font-medium text-gray-700 mb-1">Loan Amount</label>
                    <input type="number" id="amount" name="amount" value={loanForm.amount} onChange={handleLoanChange} className="w-full px-4 py-2 border border-gray-300 rounded-md text-black focus:ring-green-500 focus:border-green-500" placeholder="Enter loan amount" required min="1" step="0.01" />
                  </div>
                  <div>
                    <label htmlFor="interest_rate" className="block text-sm font-medium text-gray-700 mb-1">Interest Rate (%)</label>
                    <input type="number" id="interest_rate" name="interest_rate" value={loanForm.interest_rate} onChange={handleLoanChange} className="w-full px-4 py-2 border border-gray-300 rounded-md text-black focus:ring-green-500 focus:border-green-500" placeholder="Enter interest rate" required min="0" max="100" step="0.01" />
                  </div>
                  <div>
                    <label htmlFor="start_date" className="block text-sm font-medium text-gray-700 mb-1">Start Date</label>
                    <input type="date" id="start_date" name="start_date" value={loanForm.start_date} onChange={handleLoanChange} className="w-full px-4 py-2 border border-gray-300 rounded-md text-black focus:ring-green-500 focus:border-green-500" required />
                  </div>
                </div>
              </div>

              <div className="flex justify-end">
                <button type="submit" disabled={isSubmitting} className="px-6 py-3 bg-green-600 text-white rounded-md hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 disabled:opacity-50">
                  {isSubmitting ? "Creating Loan..." : "Create Loan"}
                </button>
              </div>
            </>
          )}
        </form>
      )}
    </div>
  );
}


