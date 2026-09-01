"use client";
import { useEffect, useState } from "react";
import Link from "next/link";
import type { StaffCommerceSummary } from "../domain/staff-order";
import { StaffNav } from "./staff-nav";
import styles from "./staff-console.module.css";
export function StaffDashboard() {
 const [data,setData]=useState<StaffCommerceSummary|null>(null); const [error,setError]=useState<string|null>(null);
 useEffect(()=>{ void fetch("/api/staff/orders/summary",{cache:"no-store"}).then(async r=>{const p=await r.json().catch(()=>null); if(!r.ok) throw new Error(p?.message??"Unable to load staff console."); setData(p);}).catch(e=>setError(e.message));},[]);
 const cards=data ? [["Total orders",data.totalOrders],["Ready to fulfill",data.readyToFulfill],["Awaiting payment",data.awaitingPayment],["Delivered / fulfilled",data.fulfilled],["Active returns",data.activeReturns],["Refund processing",data.refundProcessing],["Low stock variants",data.lowStockVariants]] : [];
 return <main className={styles.shell}><StaffNav active="overview"/><header className={styles.header}><div><span className={styles.eyebrow}>STAFF CONSOLE</span><h1>Commerce operations</h1><p>Operational health across orders, fulfillment, returns, refunds, and inventory.</p></div></header>
 {error?<div className={styles.error}>{error}</div>:null}{!data&&!error?<div className={styles.empty}>Loading operations…</div>:null}
 <section className={styles.metrics}>{cards.map(([label,value])=><div className={styles.metric} key={String(label)}><span>{label}</span><strong>{value}</strong></div>)}</section>
 <section className={styles.quick}><Link href="/staff/orders">Open order operations →</Link><Link href="/staff/catalog">Manage products & inventory →</Link><Link href="/staff/returns">Open return operations →</Link></section></main>;
}
