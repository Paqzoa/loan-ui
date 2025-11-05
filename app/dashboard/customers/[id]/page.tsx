"use client";

import React, { useEffect, useState } from "react";
import { useParams, useRouter } from "next/navigation";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";

export default function CustomerDetailsPage() {
  const { loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const params = useParams<{ id: string }>();
  const customerId = params?.id as string;

  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);
  const [downloading, setDownloading] = useState(false);

  // Auth guard: redirect to login if session expired
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    const load = async () => {
      if (!authLoading && isAuthenticated && customerId) {
        try {
          const res = await api.get(`/customers/${customerId}`);
          setData((res as any).data ?? res);
        } finally {
          setLoading(false);
        }
      }
    };
    load();
  }, [authLoading, isAuthenticated, customerId]);

  // Generate PDF Report
  const handleGeneratePDF = async () => {
    if (!customerId) return;
    try {
      setDownloading(true);
      const response = await api.get<Response>(`/customers/${customerId}/report`, {
        rawResponse: true, // 👈 tell the API to return the raw fetch response
      });
      
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      
      const a = document.createElement("a");
      a.href = url;
      a.download = `customer_report_${customerId}.pdf`;
      document.body.appendChild(a);
      a.click();
      a.remove();
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error(error);
      alert("Failed to generate report");
    } finally {
      setDownloading(false);
    }
  };

  if (authLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-gray-600">Loading...</div>
      </div>
    );
  }

  if (!isAuthenticated) return null;
  if (loading) return <div>Loading...</div>;
  if (!data) return <div>Customer not found.</div>;

  return (
    <section className="space-y-6">
      {/* Customer Info */}
      <div className="bg-white p-6 rounded shadow-sm">
        <h3 className="text-lg font-semibold">Customer Details</h3>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <Info label="Name" value={data.name} />
          <Info label="ID Number" value={data.id_number} />
          <Info label="Phone" value={data.phone} />
          <Info label="Email" value={data.email || "-"} />
          <Info label="Location" value={data.location || "-"} />
          <Info
            label="Joined"
            value={new Date(data.created_at).toLocaleDateString()}
          />
        </div>
      </div>

      {/* Loans Section */}
      <Section title="Loans" data={data.loans} render={(l: any) => (
        <div key={l.id} className="p-4 border rounded-lg hover:shadow">
          <div className="flex items-center justify-between">
            <div className="font-semibold text-gray-900">KSh {l.amount}</div>
            <span className="text-xs px-2 py-1 rounded-full bg-green-50 text-green-700">
              {l.status}
            </span>
          </div>
          <div className="mt-2 text-sm text-gray-600">
            Interest: {l.interest_rate}%
          </div>
          <div className="mt-1 text-xs text-gray-500">
            Start: {l.start_date} · Due: {l.due_date}
          </div>
        </div>
      )} />

      {/* Arrears Section */}
      <Section title="Arrears" data={data.arrears} render={(a: any) => (
        <div key={a.id} className="p-4 border rounded-lg hover:shadow">
          <div className="flex items-center justify-between">
            <div className="font-semibold text-gray-900">
              Remaining: KSh {a.remaining_amount}
            </div>
            <span
              className={`text-xs px-2 py-1 rounded-full ${
                a.is_cleared
                  ? "bg-gray-100 text-gray-700"
                  : "bg-green-50 text-green-700"
              }`}
            >
              {a.is_cleared ? "Cleared" : "Active"}
            </span>
          </div>
          <div className="mt-2 text-sm text-gray-600">
            Original: KSh {a.original_amount}
          </div>
          <div className="mt-1 text-xs text-gray-500">
            Arrears date: {a.arrears_date}
          </div>
        </div>
      )} />

      {/* Recent Installments + Generate PDF */}
      <div className="bg-white p-6 rounded shadow-sm">
        <h3 className="text-lg font-semibold flex justify-between items-center">
          <span>Recent Installments</span>
          <button
            onClick={handleGeneratePDF}
            disabled={downloading}
            className="bg-blue-600 text-white px-4 py-2 text-sm rounded-md hover:bg-blue-700 disabled:opacity-50"
          >
            {downloading ? "Generating..." : "Download PDF Report"}
          </button>
        </h3>

        {(data.installments || []).length === 0 ? (
          <div className="mt-3 text-sm text-gray-600">No installments yet</div>
        ) : (
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {(data.installments || []).map((i: any) => (
              <div key={i.id} className="p-4 border rounded-lg hover:shadow">
                <div className="font-semibold text-gray-900">
                  Paid: KSh {i.amount}
                </div>
                <div className="mt-1 text-xs text-gray-500">
                  Date: {i.payment_date}
                </div>
                <div className="mt-1 text-xs text-gray-400">
                  Loan ID: {i.loan_id}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}

function Info({ label, value }: { label: string; value: React.ReactNode }) {
  return (
    <div>
      <div className="text-gray-500">{label}</div>
      <div className="font-medium">{value}</div>
    </div>
  );
}

function Section({ title, data, render }: any) {
  return (
    <div className="bg-white p-6 rounded shadow-sm">
      <h3 className="text-lg font-semibold">{title}</h3>
      {(!data || data.length === 0) ? (
        <div className="mt-3 text-sm text-gray-600">No {title.toLowerCase()}</div>
      ) : (
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {data.map(render)}
        </div>
      )}
    </div>
  );
}
