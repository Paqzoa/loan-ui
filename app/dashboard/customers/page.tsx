"use client";

import React, { useEffect, useState } from "react";
import { api } from "@/lib/api";
import { Users } from "lucide-react";

export default function ManageCustomersPage() {
  return (
    <section>
      <h3 className="text-lg font-semibold mb-4">Manage Customers</h3>
      <div className="bg-white p-6 rounded shadow-sm">
        <ManageCustomers />
      </div>
    </section>
  );
}

function ManageCustomers() {
  const [query, setQuery] = useState("");
  const [results, setResults] = useState<any[]>([]);
  const [allCustomers, setAllCustomers] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    const load = async () => {
      setLoading(true);
      try {
        const res = await api.get("/customers?limit=100");
        const data = (res as any).data ?? res;
        setAllCustomers(Array.isArray(data) ? data : []);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  const search = async () => {
    setLoading(true);
    try {
      const res = await api.get(`/customers/search?q=${encodeURIComponent(query)}`);
      const data = (res as any).data ?? res;
      setResults((data as any) || []);
    } finally {
      setLoading(false);
    }
  };

  const list = query.trim() ? results : allCustomers;

  return (
    <div>
      <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="flex-1 flex items-center gap-2">
          <div className="inline-flex items-center justify-center w-9 h-9 rounded bg-green-100 text-green-700">
            <Users className="w-5 h-5" />
          </div>
          <input value={query} onChange={(e) => setQuery(e.target.value)} placeholder="Search by name / id / phone" className="flex-1 px-3 py-2 border rounded" />
        </div>
        <button onClick={search} disabled={loading} className="px-4 py-2 bg-green-600 text-white rounded w-full md:w-auto">{loading ? 'Searching...' : 'Search'}</button>
      </div>

      {list.length === 0 ? (
        <div className="text-sm text-gray-600">No customers found</div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4">
          {list.map((c) => (
            <a key={c.id} href={`/dashboard/customers/${c.id}`} className="group relative block rounded-lg border bg-white p-4 shadow-sm hover:shadow-md transition">
              <div className="flex items-start justify-between">
                <div>
                  <div className="text-base font-semibold text-gray-900">{c.name}</div>
                  <div className="text-xs text-gray-500">{c.id_number}</div>
                </div>
                <span className="text-xs rounded-full px-2 py-1 bg-green-50 text-green-700">Customer</span>
              </div>
              <div className="mt-3 text-sm text-gray-600">{c.phone}{c.email ? ` · ${c.email}` : ''}</div>
              <div className="mt-2 text-xs text-gray-500">{c.location || '—'}</div>

              {/* Tooltip */}
              <div className="pointer-events-none absolute top-2 right-2 opacity-0 group-hover:opacity-100 transition-opacity">
                <div className="rounded bg-gray-900 text-white text-xs px-2 py-1 shadow">
                  Joined: {new Date(c.created_at).toLocaleDateString()}
                </div>
              </div>
            </a>
          ))}
        </div>
      )}
    </div>
  );
}


