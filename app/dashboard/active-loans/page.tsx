"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import { api } from "@/lib/api";

interface LoanItem {
	id: number;
	amount: number;
	interest_rate: number;
	total_amount: number;
	remaining_amount: number;
	start_date: string;
	due_date: string;
	status: string;
	customer: { name: string | null; id_number: string; phone: string | null; location: string | null };
	guarantor: { id: number; name: string; id_number: string; phone: string; location: string | null; relationship: string | null } | null;
}

export default function ActiveLoansPage() {
	const [loans, setLoans] = useState<LoanItem[]>([]);
	const [q, setQ] = useState("");
	const [loading, setLoading] = useState(false);
	const [editingId, setEditingId] = useState<number | null>(null);
	const [editAmount, setEditAmount] = useState<string>("");
	const [editRate, setEditRate] = useState<string>("");
	const [saving, setSaving] = useState(false);

	const load = async () => {
		setLoading(true);
		try {
			const data = await api.get(`/loans/active${q ? `?q=${encodeURIComponent(q)}` : ""}`);
			setLoans((data as any).data ?? data);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		load();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const startEdit = (loan: LoanItem) => {
		setEditingId(loan.id);
		setEditAmount(String(loan.amount ?? ""));
		setEditRate(String(loan.interest_rate ?? ""));
	};

	const cancelEdit = () => {
		setEditingId(null);
		setEditAmount("");
		setEditRate("");
	};

	const saveEdit = async (loan: LoanItem) => {
		const amount = parseFloat(editAmount);
		const rate = editRate.trim() === "" ? null : parseFloat(editRate);
		if (!amount || amount <= 0) {
			alert("Enter a valid amount");
			return;
		}
		setSaving(true);
		try {
			await api.patch(`/loans/${loan.id}`, {
				amount,
				interest_rate: rate ?? undefined,
			});
			await load();
			cancelEdit();
		} catch (e: any) {
			alert(e?.response?.data?.detail || e?.message || "Failed to update loan");
		} finally {
			setSaving(false);
		}
	};

	const placeholders = Array.from({ length: 6 }, () => ({} as any));

	return (
		<div className="container mx-auto px-4 py-6">
			<div className="flex items-center justify-between mb-6">
				<h1 className="text-2xl font-bold">Active Loans</h1>
				<div className="flex gap-2">
					<input
						type="text"
						placeholder="Search by Loan ID or Customer ID Number"
						value={q}
						onChange={(e) => setQ(e.target.value)}
						className="px-4 py-2 border border-gray-300 rounded-md text-black"
					/>
					<button onClick={load} className="px-4 py-2 bg-green-600 text-white rounded-md">
						Search
					</button>
				</div>
			</div>

			<div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
				{(loading ? placeholders : loans).map((l: any, idx: number) => (
					<div key={l?.id ?? idx} className="border rounded-lg p-4 bg-white shadow-sm">
						<div className="flex items-center justify-between mb-2">
							<div className="font-semibold">Loan #{l?.id ?? "…"}</div>
							<span className={`text-xs px-2 py-1 rounded ${l?.status === "ACTIVE" ? "bg-green-100 text-green-700" : "bg-yellow-100 text-yellow-800"}`}>{l?.status ?? ""}</span>
						</div>
						<div className="text-sm text-gray-700">
							<div>Amount: <span className="font-medium">KSh {l?.amount?.toLocaleString?.() ?? "…"}</span></div>
							<div>Remaining: <span className="font-medium">KSh {l?.remaining_amount?.toLocaleString?.() ?? "…"}</span></div>
							<div>Customer: {l?.customer?.name ?? "Unknown"} ({l?.customer?.id_number ?? "…"})</div>
							{l?.guarantor && (<div>Guarantor: {l.guarantor.name} ({l.guarantor.relationship || "-"})</div>)}
							<div className="text-xs text-gray-500 mt-1">Start {l?.start_date ?? "…"} · Due {l?.due_date ?? "…"}</div>
						</div>
						{editingId === l?.id ? (
							<div className="mt-3 space-y-2">
								<div className="flex flex-col gap-2">
									<label className="text-xs text-gray-600">New principal amount</label>
									<input
										type="number"
										value={editAmount}
										onChange={(e) => setEditAmount(e.target.value)}
										className="px-3 py-2 border rounded text-sm"
									/>
								</div>
								<div className="flex flex-col gap-2">
									<label className="text-xs text-gray-600">Interest rate (%)</label>
									<input
										type="number"
										value={editRate}
										onChange={(e) => setEditRate(e.target.value)}
										className="px-3 py-2 border rounded text-sm"
									/>
								</div>
								<div className="flex justify-end gap-2">
									<button onClick={cancelEdit} className="px-3 py-2 text-sm border rounded-md">Cancel</button>
									<button
										onClick={() => saveEdit(l)}
										disabled={saving}
										className="px-3 py-2 text-sm bg-blue-600 text-white rounded-md disabled:opacity-60"
									>
										{saving ? "Saving..." : "Save"}
									</button>
								</div>
								<div className="text-[11px] text-gray-500">
									Already-paid installments stay accounted for; remaining is recalculated from the new total.
								</div>
							</div>
						) : (
							<div className="mt-3 flex justify-end gap-2">
								{l?.id ? (
									<>
										<button
											onClick={() => startEdit(l)}
											className="px-3 py-2 text-sm border rounded-md"
										>
											Edit
										</button>
										<Link href={`/dashboard/loans/${l.id}`} className="px-3 py-2 text-sm bg-gray-900 text-white rounded-md">View Details</Link>
									</>
								) : (
									<span className="px-3 py-2 text-sm bg-gray-200 text-gray-500 rounded-md">Loading…</span>
								)}
							</div>
						)}
					</div>
				))}
			</div>
		</div>
	);
}
