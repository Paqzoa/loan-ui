"use client";

import React, { useEffect, useState } from "react";
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Legend, CartesianGrid } from "recharts";
import { api } from "@/lib/api";
import { useAuth } from "@/lib/auth";
import { useRouter } from "next/navigation";

interface DashboardMetrics {
  active_loans: number;
  active_loans_outstanding: number;
  active_arrears: number;
  active_arrears_outstanding: number;
}

interface TrendData {
  month: string;
  returns: number;
  interest: number;
}

interface SummaryMetrics {
  completed_loans_amount_this_month: number;
  active_loans_count_this_month: number;
  interest_last_three_months: number;
  arrears_count_last_three_months: number;
}

export default function DashboardOverviewPage() {
  const { loading: authLoading, isAuthenticated } = useAuth();
  const router = useRouter();
  const [metrics, setMetrics] = useState({ activeLoans: 0, loansOutstanding: 0, arrears: 0, arrearsOutstanding: 0 });
  const [chartData, setChartData] = useState<TrendData[]>([]);
  const [summary, setSummary] = useState<SummaryMetrics | null>(null);
  const [loading, setLoading] = useState(false);

  // Auth guard: redirect to login if session expired
  useEffect(() => {
    if (!authLoading && !isAuthenticated) {
      router.push("/login");
    }
  }, [authLoading, isAuthenticated, router]);

  useEffect(() => {
    if (!authLoading && isAuthenticated) {
      fetchDashboard();
    }
  }, [authLoading, isAuthenticated]);

  async function fetchDashboard() {
    setLoading(true);
    try {
      const metricsRes = await api.get<DashboardMetrics>("/dashboard/metrics");
      const trendsRes = await api.get<TrendData[] | { trends: TrendData[] }>("/dashboard/trends?months=3");
      const summaryRes = await api.get<SummaryMetrics>("/dashboard/summary");

      const m = (metricsRes as any).data ?? metricsRes;
      const tAny = (trendsRes as any).data ?? trendsRes;
      const trends: TrendData[] = Array.isArray(tAny) ? tAny : (tAny?.trends ?? []);

      setMetrics({
        activeLoans: (m as any)?.active_loans ?? 0,
        loansOutstanding: (m as any)?.active_loans_outstanding ?? 0,
        arrears: (m as any)?.active_arrears ?? 0,
        arrearsOutstanding: (m as any)?.active_arrears_outstanding ?? 0,
      });
      setChartData(trends);
      setSummary(((summaryRes as any).data ?? summaryRes) as SummaryMetrics);
    } finally {
      setLoading(false);
    }
  }

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
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-6">
        <div className="p-4 bg-white rounded shadow-sm">
          <div className="text-sm text-gray-500">Active Loans</div>
          <div className="mt-2 text-2xl font-extrabold text-blue-900">{metrics.activeLoans}</div>
          <div className="mt-1 text-sm text-blue-900 font-semibold">Outstanding Balances: KSh {metrics.loansOutstanding.toLocaleString()}</div>
        </div>
        <div className="p-4 bg-white rounded shadow-sm">
          <div className="text-sm text-gray-500">Arrears</div>
          <div className="mt-2 text-2xl font-extrabold text-red-700">{metrics.arrears}</div>
          <div className="mt-1 text-sm text-red-700 font-semibold">Remaining: KSh {metrics.arrearsOutstanding.toLocaleString()}</div>
        </div>
        <div className="p-4 bg-white rounded shadow-sm">
          <div className="text-sm text-gray-500">Overview</div>
          <div className="mt-2 text-sm text-gray-600">Quick summary and actions</div>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="bg-white p-4 rounded shadow-sm">
          <h3 className="mb-3 font-semibold">Returns & Interest (last 3 months)</h3>
          <div style={{ width: "100%", height: 300 }}>
            <ResponsiveContainer>
              <BarChart data={chartData} margin={{ top: 10, right: 20, left: 0, bottom: 0 }}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip />
                <Legend />
                <Bar dataKey="returns" name="Returns" fill="#16a34a" />
                <Bar dataKey="interest" name="Interest Gained" fill="#065f46" />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>
        <div className="bg-white p-4 rounded shadow-sm">
          <h3 className="mb-3 font-semibold">Summary</h3>
          {!summary ? (
            <div className="text-sm text-gray-600">Loading...</div>
          ) : (
            <ul className="mt-2 space-y-2 text-sm">
              <li>
                <span className="text-gray-600">Completed loans this month:</span>
                <span className="ml-2 font-semibold text-gray-900">KSh {summary.completed_loans_amount_this_month.toLocaleString()}</span>
              </li>
              <li>
                <span className="text-gray-600">Active loans started this month:</span>
                <span className="ml-2 font-semibold text-gray-900">{summary.active_loans_count_this_month}</span>
              </li>
              <li>
                <span className="text-gray-600">Interest gained (last 3 months):</span>
                <span className="ml-2 font-semibold text-gray-900">KSh {summary.interest_last_three_months.toLocaleString()}</span>
              </li>
              <li>
                <span className="text-gray-600">Arrears (last 3 months):</span>
                <span className="ml-2 font-semibold text-gray-900">{summary.arrears_count_last_three_months}</span>
              </li>
            </ul>
          )}
        </div>
      </div>
    </section>
  );
}


