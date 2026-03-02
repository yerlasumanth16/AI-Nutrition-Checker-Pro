"use client";

import { useState } from "react";
import { useSession, signOut } from "next-auth/react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import jsPDF from "jspdf";
import { LineChart, Line, XAxis, YAxis, Tooltip, ResponsiveContainer } from "recharts";

export default function DashboardPage() {
  const { data } = useSession();
  const [text, setText] = useState("");
  const [imageUrl, setImageUrl] = useState("");
  const [result, setResult] = useState<any>(null);
  const [scoreHistory, setScoreHistory] = useState<any[]>([]);

  const analyzeText = async () => {
    const res = await fetch("/api/analyze/text", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ text }) });
    const json = await res.json();
    if (!res.ok) return alert(json.error);
    setResult(json);
    setScoreHistory((s) => [...s, { day: s.length + 1, score: json.healthScore }]);
  };

  const analyzeImage = async () => {
    const res = await fetch("/api/analyze/image", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ imageUrl }) });
    const json = await res.json();
    if (!res.ok) return alert(json.error);
    setResult(json);
    setScoreHistory((s) => [...s, { day: s.length + 1, score: json.healthScore }]);
  };

  const upgrade = async () => {
    const orderRes = await fetch("/api/payment/order", { method: "POST" });
    const order = await orderRes.json();
    if (!orderRes.ok) return alert(order.error);
    const rz = new (window as any).Razorpay({
      key: order.keyId,
      amount: order.amount,
      order_id: order.orderId,
      handler: async (response: any) => {
        const verify = await fetch("/api/payment/verify", { method: "POST", headers: { "content-type": "application/json" }, body: JSON.stringify({ orderId: response.razorpay_order_id, paymentId: response.razorpay_payment_id, signature: response.razorpay_signature }) });
        const v = await verify.json();
        if (verify.ok) alert("Upgraded to premium"); else alert(v.error);
      },
    });
    rz.open();
  };

  const downloadPdf = () => {
    if (!result) return;
    const doc = new jsPDF();
    doc.text("Nutrition Report", 10, 10);
    doc.text(JSON.stringify(result, null, 2), 10, 20);
    doc.save("nutrition-report.pdf");
  };

  return <main className="grid min-h-screen grid-cols-1 gap-4 p-4 md:grid-cols-4">
    <script src="https://checkout.razorpay.com/v1/checkout.js"></script>
    <aside className="space-y-2 md:col-span-1"><Card>
      <p>{data?.user?.email}</p>
      <p>Role: {(data?.user as any)?.role || "FREE"}</p>
      <Button onClick={() => signOut({ callbackUrl: "/" })}>Logout</Button>
    </Card></aside>

    <section className="space-y-4 md:col-span-3">
      <Card className="space-y-2"><h2>Text Analysis</h2><Input value={text} onChange={(e) => setText(e.target.value)} placeholder="2 eggs and toast"/><Button onClick={analyzeText}>Analyze text</Button></Card>
      <Card className="space-y-2"><h2>Image Analysis</h2><Input value={imageUrl} onChange={(e) => setImageUrl(e.target.value)} placeholder="https://..."/><Button onClick={analyzeImage}>Analyze image</Button></Card>
      <Card><Button onClick={upgrade}>Upgrade Premium (Razorpay)</Button></Card>
      <Card><Button onClick={downloadPdf}>Download PDF report</Button></Card>
      <Card className="h-64"><ResponsiveContainer width="100%" height="100%"><LineChart data={scoreHistory}><XAxis dataKey="day"/><YAxis/><Tooltip/><Line dataKey="score" stroke="#34d399" /></LineChart></ResponsiveContainer></Card>
      {result && <Card><pre className="text-xs overflow-auto">{JSON.stringify(result, null, 2)}</pre></Card>}
    </section>
  </main>;
}
