"use client";
import Link from "next/link";
import { useAuth } from "@/context/AuthContext";

export default function Nav() {
  const { user, logout } = useAuth();

  return (
    <nav className="border-b bg-white shadow-xs">
      <div className="max-w-7xl mx-auto px-4 h-14 flex items-center justify-between">
        <Link href="/" className="text-lg font-bold tracking-tight">
          ⚡ Rental Marketplace
        </Link>

        <div className="flex items-center gap-4 text-sm">
          <Link href="/" className="hover:text-blue-600 transition-colors">
            Catálogo
          </Link>

          {user ? (
            <>
              <Link href="/products/new" className="hover:text-blue-600 transition-colors">
                Anunciar
              </Link>
              <Link href="/rentals" className="hover:text-blue-600 transition-colors">
                Aluguéis
              </Link>
              <Link href="/profile" className="hover:text-blue-600 transition-colors">
                Perfil
              </Link>
              <button onClick={logout} className="text-red-500 hover:text-red-700 transition-colors">
                Sair
              </button>
            </>
          ) : (
            <>
              <Link
                href="/login"
                className="hover:text-blue-600 transition-colors"
              >
                Entrar
              </Link>
              <Link
                href="/register"
                className="bg-blue-600 text-white px-4 py-1.5 rounded-lg hover:bg-blue-700 transition-colors"
              >
                Cadastrar
              </Link>
            </>
          )}
        </div>
      </div>
    </nav>
  );
}
