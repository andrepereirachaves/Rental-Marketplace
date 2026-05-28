"use client";
import { useState, useEffect } from "react";
import Link from "next/link";
import { products as productsApi } from "@/lib/api";

export default function Home() {
  const [items, setItems] = useState([]);
  const [categories, setCategories] = useState([]);
  const [search, setSearch] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    productsApi.categories().then(setCategories).catch(() => {});
  }, []);

  useEffect(() => {
    setLoading(true);
    productsApi
      .list({ search, category })
      .then(setItems)
      .catch(() => {})
      .finally(() => setLoading(false));
  }, [search, category]);

  return (
    <div className="max-w-7xl mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="text-3xl font-bold mb-2">
          Encontre o que você precisa
        </h1>
        <p className="text-zinc-500">
          Alugue equipamentos de alto valor perto de você
        </p>
      </div>

      <div className="flex gap-4 mb-8">
        <input
          type="text"
          placeholder="Buscar por nome ou descrição..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="flex-1 border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        />
        <select
          value={category}
          onChange={(e) => setCategory(e.target.value)}
          className="border rounded-lg px-4 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          <option value="">Todas as categorias</option>
          {categories.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="text-center py-20 text-zinc-400">Carregando...</div>
      ) : items.length === 0 ? (
        <div className="text-center py-20 text-zinc-400">
          Nenhum produto encontrado.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
          {items.map((item) => (
            <Link
              key={item.id}
              href={`/products/${item.id}`}
              className="bg-white rounded-xl border hover:shadow-lg transition-shadow overflow-hidden"
            >
              <div className="h-48 bg-zinc-100 flex items-center justify-center text-zinc-300 text-sm">
                {item.images?.[0] ? (
                  <img
                    src={item.images[0]}
                    alt={item.title}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  "Sem imagem"
                )}
              </div>
              <div className="p-4">
                <span className="text-xs font-medium text-blue-600 bg-blue-50 px-2 py-0.5 rounded-full">
                  {item.category}
                </span>
                <h3 className="mt-2 font-semibold text-base">{item.title}</h3>
                <p className="text-zinc-500 text-sm mt-1 line-clamp-2">
                  {item.description}
                </p>
                <div className="mt-3 flex items-center justify-between">
                  <span className="text-lg font-bold">
                    R$ {parseFloat(item.price_per_day).toFixed(2)}
                    <span className="text-sm font-normal text-zinc-400">
                      /dia
                    </span>
                  </span>
                  {item.owner_rating > 0 && (
                    <span className="text-sm text-yellow-500">
                      ★ {item.owner_rating}
                    </span>
                  )}
                </div>
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
