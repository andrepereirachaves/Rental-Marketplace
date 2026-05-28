"use client";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { rentals as rentalsApi, users as usersApi, reviews as reviewsApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

const statusLabel = {
  active: "Ativo", completed: "Concluído", disputed: "Em disputa", cancelled: "Cancelado",
};
const statusColor = {
  active: "text-blue-600 bg-blue-50", completed: "text-green-600 bg-green-50",
  disputed: "text-red-600 bg-red-50", cancelled: "text-zinc-500 bg-zinc-100",
};

export default function RentalsPage() {
  const { user } = useAuth();
  const router = useRouter();
  const [list, setList] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qrModal, setQrModal] = useState(null);
  const [reviewModal, setReviewModal] = useState(null);
  const [reviewRating, setReviewRating] = useState(5);
  const [reviewComment, setReviewComment] = useState("");

  useEffect(() => {
    if (!user) return router.push("/login");
    rentalsApi.my().then(setList).catch(() => {}).finally(() => setLoading(false));
  }, [user, router]);

  const handlePickup = async (id) => {
    try { await rentalsApi.pickup(id); setList((prev) => prev.map((r) => r.id === id ? { ...r, pickup_confirmed: true } : r)); }
    catch (err) { alert(err.message); }
  };
  const handleReturn = async (id) => {
    try { await rentalsApi.return(id); setList((prev) => prev.map((r) => r.id === id ? { ...r, return_confirmed: true, status: "completed" } : r)); }
    catch (err) { alert(err.message); }
  };

  const generateQr = async (rentalId) => {
    try {
      const data = await usersApi.generateQr({ rental_id: rentalId });
      setQrModal(data);
    } catch (err) { alert(err.message); }
  };

  const submitReview = async (rentalId) => {
    try {
      await reviewsApi.create({ rental_id: rentalId, rating: reviewRating, comment: reviewComment });
      setReviewModal(null);
      setReviewComment("");
    } catch (err) { alert(err.message); }
  };

  return (
    <div className="max-w-3xl mx-auto px-4 py-8">
      <h1 className="text-2xl font-bold mb-6">Meus Aluguéis</h1>

      {loading ? (
        <div className="text-center py-20 text-zinc-400">Carregando...</div>
      ) : list.length === 0 ? (
        <div className="text-center py-20 text-zinc-400">Nenhum aluguel encontrado.</div>
      ) : (
        <div className="space-y-4">
          {list.map((rental) => (
            <div key={rental.id} className="bg-white border rounded-xl p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold">{rental.product_title}</h3>
                  <p className="text-sm text-zinc-500">
                    {new Date(rental.start_date).toLocaleDateString()} → {new Date(rental.end_date).toLocaleDateString()}
                  </p>
                  <p className="text-sm font-medium mt-1">R$ {parseFloat(rental.total_price).toFixed(2)}</p>
                </div>
                <span className={`text-xs font-medium px-2 py-0.5 rounded-full ${statusColor[rental.status]}`}>
                  {statusLabel[rental.status]}
                </span>
              </div>

              {rental.status === "active" && (
                <div className="mt-3 flex flex-wrap gap-2">
                  {!rental.pickup_confirmed && (
                    <>
                      <button onClick={() => handlePickup(rental.id)}
                        className="text-xs bg-blue-600 text-white px-3 py-1.5 rounded-lg hover:bg-blue-700">
                        Confirmar Retirada
                      </button>
                      <button onClick={() => generateQr(rental.id)}
                        className="text-xs bg-zinc-700 text-white px-3 py-1.5 rounded-lg hover:bg-zinc-800">
                        Gerar QR Code
                      </button>
                    </>
                  )}
                  {rental.pickup_confirmed && !rental.return_confirmed && (
                    <button onClick={() => handleReturn(rental.id)}
                      className="text-xs bg-green-600 text-white px-3 py-1.5 rounded-lg hover:bg-green-700">
                      Confirmar Devolução
                    </button>
                  )}
                </div>
              )}

              {rental.status === "completed" && (
                <div className="mt-3">
                  <button onClick={() => setReviewModal(rental)}
                    className="text-xs bg-yellow-500 text-white px-3 py-1.5 rounded-lg hover:bg-yellow-600">
                    Avaliar
                  </button>
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {qrModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setQrModal(null)}>
          <div className="bg-white rounded-xl p-8 max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-4">QR Code do Aluguel</h3>
            <div className="bg-white border-2 rounded-xl p-4 mb-4 flex items-center justify-center">
              <div className="text-center">
                <div className="font-mono text-xs bg-zinc-100 p-4 rounded-lg break-all mb-3 select-all">
                  {qrModal.token}
                </div>
                <p className="text-xs text-zinc-500 mb-2">Token de segurança de 64 caracteres</p>
                <p className="text-xs font-medium">Use na página de validação do parceiro</p>
              </div>
            </div>
            <button onClick={() => { navigator.clipboard?.writeText(qrModal.token); alert("Token copiado!"); }}
              className="w-full bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 text-sm mb-2">
              Copiar Token
            </button>
            <button onClick={() => setQrModal(null)}
              className="w-full bg-zinc-100 py-2 rounded-lg hover:bg-zinc-200 text-sm">
              Fechar
            </button>
          </div>
        </div>
      )}

      {reviewModal && (
        <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50" onClick={() => setReviewModal(null)}>
          <div className="bg-white rounded-xl p-8 max-w-sm w-full mx-4" onClick={(e) => e.stopPropagation()}>
            <h3 className="text-lg font-bold mb-2">Avaliar</h3>
            <p className="text-sm text-zinc-500 mb-4">{reviewModal.product_title}</p>
            <div className="space-y-3">
              <div>
                <label className="block text-sm font-medium mb-1">Nota</label>
                <select value={reviewRating} onChange={(e) => setReviewRating(Number(e.target.value))}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none">
                  {[5,4,3,2,1].map((n) => <option key={n} value={n}>{n} ★</option>)}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">Comentário</label>
                <textarea value={reviewComment} onChange={(e) => setReviewComment(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:ring-2 focus:ring-blue-500 focus:outline-none" rows={3} />
              </div>
              <div className="flex gap-2">
                <button onClick={() => submitReview(reviewModal.id)}
                  className="flex-1 bg-blue-600 text-white py-2 rounded-lg hover:bg-blue-700 text-sm">
                  Enviar
                </button>
                <button onClick={() => setReviewModal(null)}
                  className="flex-1 bg-zinc-100 py-2 rounded-lg hover:bg-zinc-200 text-sm">
                  Cancelar
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
