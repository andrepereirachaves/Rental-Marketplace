"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { users as usersApi, auth as authApi, reviews as reviewsApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function ProfilePage() {
  const { user, token, logout } = useAuth();
  const router = useRouter();
  const [profile, setProfile] = useState(null);
  const [name, setName] = useState("");
  const [phone, setPhone] = useState("");
  const [document, setDocument] = useState("");
  const [reviews, setReviews] = useState([]);
  const [message, setMessage] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!token) return router.push("/login");
    authApi.me().then((u) => {
      setProfile(u);
      setName(u.name);
      setPhone(u.phone || "");
    }).catch(() => {});
    reviewsApi.pending().then(setReviews).catch(() => {});
    setLoading(false);
  }, [token, router]);

  const handleUpdate = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      const updated = await usersApi.updateProfile({ name, phone });
      setProfile((prev) => ({ ...prev, ...updated }));
      setMessage("Perfil atualizado!");
    } catch (err) {
      setMessage(`Erro: ${err.message}`);
    }
  };

  const handleKyc = async (e) => {
    e.preventDefault();
    setMessage("");
    try {
      const result = await usersApi.submitKyc({ document });
      setProfile((prev) => ({ ...prev, kyc_verified: true }));
      setMessage(result.message);
    } catch (err) {
      setMessage(`Erro: ${err.message}`);
    }
  };

  if (loading) return <div className="text-center py-20 text-zinc-400">Carregando...</div>;

  return (
    <div className="max-w-lg mx-auto px-4 py-8 space-y-8">
      <h1 className="text-2xl font-bold">Meu Perfil</h1>

      {message && (
        <div className={`text-sm p-3 rounded-lg ${message.startsWith("Erro") ? "bg-red-50 text-red-600" : "bg-green-50 text-green-700"}`}>
          {message}
        </div>
      )}

      <form onSubmit={handleUpdate} className="space-y-4 bg-white border rounded-xl p-6">
        <h2 className="font-semibold">Informações Pessoais</h2>
        <div>
          <label className="block text-sm font-medium mb-1">Nome</label>
          <input value={name} onChange={(e) => setName(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Email</label>
          <input value={profile?.email || ""} disabled
            className="w-full border rounded-lg px-3 py-2 text-sm bg-zinc-50 text-zinc-500" />
        </div>
        <div>
          <label className="block text-sm font-medium mb-1">Telefone</label>
          <input value={phone} onChange={(e) => setPhone(e.target.value)}
            className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
        </div>
        <button type="submit"
          className="bg-blue-600 text-white px-4 py-2 rounded-lg hover:bg-blue-700 transition-colors text-sm font-medium">
          Salvar
        </button>
      </form>

      <form onSubmit={handleKyc} className="space-y-4 bg-white border rounded-xl p-6">
        <h2 className="font-semibold">Verificação de Identidade (KYC)</h2>
        {profile?.kyc_verified ? (
          <div className="bg-green-50 text-green-700 text-sm p-3 rounded-lg flex items-center gap-2">
            ✓ Documento verificado
          </div>
        ) : (
          <>
            <p className="text-sm text-zinc-500">Envie seu CPF ou RG para liberar anúncios e aluguéis.</p>
            <div>
              <label className="block text-sm font-medium mb-1">Nº do Documento</label>
              <input required value={document} onChange={(e) => setDocument(e.target.value)}
                className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" />
            </div>
            <button type="submit"
              className="bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors text-sm font-medium">
              Enviar para Verificação
            </button>
          </>
        )}
      </form>

      {reviews.length > 0 && (
        <div className="bg-white border rounded-xl p-6">
          <h2 className="font-semibold mb-4">Avaliações Pendentes</h2>
          <div className="space-y-3">
            {reviews.map((r) => (
              <div key={r.rental_id} className="flex items-center justify-between">
                <div className="text-sm">
                  <span className="font-medium">{r.product_title}</span>
                  <span className="text-zinc-500"> com {r.other_name}</span>
                </div>
                <ReviewButton rentalId={r.rental_id} revieweeId={r.other_id} onDone={() => {
                  setReviews((prev) => prev.filter((x) => x.rental_id !== r.rental_id));
                }} />
              </div>
            ))}
          </div>
        </div>
      )}

      <button onClick={logout}
        className="text-red-500 hover:text-red-700 text-sm">
        Sair da conta
      </button>
    </div>
  );
}

function ReviewButton({ rentalId, revieweeId, onDone }) {
  const [open, setOpen] = useState(false);
  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await reviewsApi.create({ rental_id: rentalId, rating, comment });
      setOpen(false);
      onDone();
    } catch (err) {
      alert(err.message);
    } finally {
      setSubmitting(false);
    }
  };

  if (!open) {
    return (
      <button onClick={() => setOpen(true)}
        className="text-xs bg-yellow-500 text-white px-3 py-1.5 rounded-lg hover:bg-yellow-600">
        Avaliar
      </button>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-2 mt-2">
      <select value={rating} onChange={(e) => setRating(Number(e.target.value))}
        className="border rounded px-2 py-1 text-xs">
        {[1,2,3,4,5].map((n) => <option key={n} value={n}>{n} ★</option>)}
      </select>
      <input value={comment} onChange={(e) => setComment(e.target.value)} placeholder="Comentário..."
        className="border rounded px-2 py-1 text-xs w-full" />
      <div className="flex gap-1">
        <button type="submit" disabled={submitting}
          className="text-xs bg-blue-600 text-white px-2 py-1 rounded hover:bg-blue-700">
          {submitting ? "..." : "Enviar"}
        </button>
        <button type="button" onClick={() => setOpen(false)}
          className="text-xs bg-zinc-200 px-2 py-1 rounded hover:bg-zinc-300">
          Cancelar
        </button>
      </div>
    </form>
  );
}
