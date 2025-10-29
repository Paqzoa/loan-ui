"use client";

import React, { useEffect, useState } from "react";
import { useParams } from "next/navigation";
import { api } from "@/lib/api";

export default function CustomerDetailsPage() {
  const params = useParams<{ id: string }>();
  const customerId = params?.id as string;
  const [data, setData] = useState<any | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/customers/${customerId}`);
        setData((res as any).data ?? res);
      } finally {
        setLoading(false);
      }
    };
    if (customerId) load();
  }, [customerId]);

  if (loading) return <div>Loading...</div>;
  if (!data) return <div>Customer not found.</div>;

  return (
    <section className="space-y-6">
      <div className="bg-white p-6 rounded shadow-sm">
        <h3 className="text-lg font-semibold">Customer Details</h3>
        <div className="mt-3 grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
          <Info label="Name" value={data.name} />
          <Info label="ID Number" value={data.id_number} />
          <Info label="Phone" value={data.phone} />
          <Info label="Email" value={data.email || '-'} />
          <Info label="Location" value={(data as any).location || '-'} />
          <Info label="Joined" value={new Date(data.created_at).toLocaleDateString()} />
        </div>
      </div>

      <div className="bg-white p-6 rounded shadow-sm">
        <h3 className="text-lg font-semibold">Loans</h3>
        {(data.loans || []).length === 0 ? (
          <div className="mt-3 text-sm text-gray-600">No loans</div>
        ) : (
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {(data.loans || []).map((l: any) => (
              <div key={l.id} className="p-4 border rounded-lg hover:shadow">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-gray-900">KSh {l.amount}</div>
                  <span className="text-xs px-2 py-1 rounded-full bg-green-50 text-green-700">{l.status}</span>
                </div>
                <div className="mt-2 text-sm text-gray-600">Interest: {l.interest_rate}%</div>
                <div className="mt-1 text-xs text-gray-500">Start: {l.start_date} · Due: {l.due_date}</div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div className="bg-white p-6 rounded shadow-sm">
        <h3 className="text-lg font-semibold">Aliases</h3>
        {(data.aliases || []).length === 0 ? (
          <div className="mt-3 text-sm text-gray-600">No aliases</div>
        ) : (
          <div className="mt-3 grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
            {(data.aliases || []).map((a: any) => (
              <div key={a.id} className="p-4 border rounded-lg hover:shadow">
                <div className="flex items-center justify-between">
                  <div className="font-semibold text-gray-900">Remaining: KSh {a.remaining_amount}</div>
                  <span className={`text-xs px-2 py-1 rounded-full ${a.is_cleared ? 'bg-gray-100 text-gray-700' : 'bg-green-50 text-green-700'}`}>{a.is_cleared ? 'Cleared' : 'Active'}</span>
                </div>
                <div className="mt-2 text-sm text-gray-600">Original: KSh {a.original_amount}</div>
                <div className="mt-1 text-xs text-gray-500">Alias date: {a.alias_date}</div>
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


