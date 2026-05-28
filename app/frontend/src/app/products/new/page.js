"use client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { products as productsApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function NewProductPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [form, setForm] = useState({
    title: "", description: "", category: "Ferramentas",
    price_per_day: "", deposit_amount: "", city: "", state: "",
    latitude: "", longitude: "",
  });
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  if (!user) { router.push("/login"); return null; }

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    setError("");
    try {
      await productsApi.create({
        ...form,
        price_per_day: parseFloat(form.price_per_day),
        deposit_amount: parseFloat(form.deposit_amount) || 0,
        latitude: form.latitude ? parseFloat(form.latitude) : null,
        longitude: form.longitude ? parseFloat(form.longitude) : null,
      });
      router.push("/");
    } catch (err) {
      setError(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div className="max-w-lg mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Criar Anúncio</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <div className="bg-red-50 text-red-600 text-sm p-3 rounded-lg">{error}</div>}

        <div>
          <label className="block text-sm font-medium mb-1">Título *</label>
          <input required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
        </div>

        <div>
          <label className="block text-sm font-medium mb-1">Descrição</label>
          <textarea value={form.description} onChange={(e) => setForm({ ...form, description: e.target.value })}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" rows={3} />
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Categoria *</label>
            <select required value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
              <option value="Ferramentas">Ferramentas</option>
              <option value="Eletrônicos">Eletrônicos</option>
              <option value="Festa">Festa</option>
              <option value="Esportes">Esportes</option>
              <option value="Outros">Outros</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Preço por dia *</label>
            <input type="number" step="0.01" min="0" required value={form.price_per_day}
              onChange={(e) => setForm({ ...form, price_per_day: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Caução (R$)</label>
            <input type="number" step="0.01" min="0" value={form.deposit_amount}
              onChange={(e) => setForm({ ...form, deposit_amount: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm font-medium mb-1">Cidade</label>
            <input value={form.city} onChange={(e) => setForm({ ...form, city: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1">Estado</label>
            <input value={form.state} onChange={(e) => setForm({ ...form, state: e.target.value })}
              className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
          </div>
        </div>

        <button type="submit" disabled={submitting}
          className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium">
          {submitting ? "Publicando..." : "Publicar Anúncio"}
        </button>
      </form>
    </div>
  );
}
