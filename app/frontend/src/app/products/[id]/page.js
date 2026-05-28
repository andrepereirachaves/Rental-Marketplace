"use client";
import { useState, useEffect } from "react";
import { useParams, useRouter } from "next/navigation";
import { products as productsApi, rentals as rentalsApi } from "@/lib/api";
import { useAuth } from "@/context/AuthContext";

export default function ProductDetail() {
  const { id } = useParams();
  const { user } = useAuth();
  const router = useRouter();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [booking, setBooking] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    productsApi
      .get(id)
      .then(setItem)
      .catch(() => router.push("/"))
      .finally(() => setLoading(false));
  }, [id, router]);

  const handleReserve = async (e) => {
    e.preventDefault();
    if (!user) return router.push("/login");
    setBooking(true);
    setMessage("");
    try {
      const data = await rentalsApi.create({
        product_id: id,
        start_date: startDate,
        end_date: endDate,
      });
      setMessage(
        `Reserva confirmada! Total: R$ ${parseFloat(data.rental.total_price).toFixed(2)}`
      );
    } catch (err) {
      setMessage(`Erro: ${err.message}`);
    } finally {
      setBooking(false);
    }
  };

  if (loading)
    return <div className="text-center py-20 text-zinc-400">Carregando...</div>;
  if (!item) return null;

  const today = new Date().toISOString().split("T")[0];

  return (
    <div className="max-w-4xl mx-auto px-4 py-8">
      <button
        onClick={() => router.back()}
        className="text-sm text-blue-600 hover:underline mb-4 inline-block"
      >
        ← Voltar
      </button>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div className="h-80 bg-zinc-100 rounded-xl flex items-center justify-center text-zinc-300">
          {item.images?.[0] ? (
            <img
              src={item.images[0]}
              alt={item.title}
              className="w-full h-full object-cover rounded-xl"
            />
          ) : (
            "Sem imagem"
          )}
        </div>

        <div>
          <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
            {item.category}
          </span>
          <h1 className="text-2xl font-bold mt-2">{item.title}</h1>
          <p className="text-zinc-500 mt-2">{item.description}</p>

          <div className="mt-4 space-y-1 text-sm text-zinc-600">
            <p>
              📍 {item.city}, {item.state}
            </p>
            <p>
              👤 {item.owner_name}
              {item.owner_rating > 0 && ` ★ ${item.owner_rating}`}
            </p>
          </div>

          <div className="mt-6 p-4 bg-zinc-50 rounded-xl">
            <span className="text-2xl font-bold">
              R$ {parseFloat(item.price_per_day).toFixed(2)}
              <span className="text-sm font-normal text-zinc-400">/dia</span>
            </span>
            {parseFloat(item.deposit_amount) > 0 && (
              <p className="text-sm text-zinc-500 mt-1">
                Caução: R$ {parseFloat(item.deposit_amount).toFixed(2)}
              </p>
            )}
          </div>

          <form onSubmit={handleReserve} className="mt-6 space-y-3">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-sm font-medium mb-1">
                  Data de início
                </label>
                <input
                  type="date"
                  required
                  min={today}
                  value={startDate}
                  onChange={(e) => setStartDate(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
              <div>
                <label className="block text-sm font-medium mb-1">
                  Data de fim
                </label>
                <input
                  type="date"
                  required
                  min={startDate || today}
                  value={endDate}
                  onChange={(e) => setEndDate(e.target.value)}
                  className="w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={booking}
              className="w-full bg-blue-600 text-white py-3 rounded-lg hover:bg-blue-700 disabled:opacity-50 transition-colors font-medium"
            >
              {booking ? "Reservando..." : "Reservar Agora"}
            </button>
          </form>

          {message && (
            <div
              className={`mt-4 text-sm p-3 rounded-lg ${
                message.startsWith("Erro")
                  ? "bg-red-50 text-red-600"
                  : "bg-green-50 text-green-700"
              }`}
            >
              {message}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
