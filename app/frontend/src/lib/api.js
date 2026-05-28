const API_URL = process.env.NEXT_PUBLIC_API_URL || "http://localhost:3000/api";

async function request(method, path, data) {
  const token =
    typeof window !== "undefined" ? localStorage.getItem("token") : null;
  const headers = { "Content-Type": "application/json" };
  if (token) headers["Authorization"] = `Bearer ${token}`;

  const res = await fetch(`${API_URL}${path}`, {
    method,
    headers,
    body: data ? JSON.stringify(data) : undefined,
  });

  const json = await res.json();
  if (!res.ok) throw new Error(json.error || `Request failed (${res.status})`);
  return json;
}

export const auth = {
  register: (data) => request("POST", "/auth/register", data),
  login: (data) => request("POST", "/auth/login", data),
  me: () => request("GET", "/auth/me"),
};

export const products = {
  list: (params = {}) => {
    const q = new URLSearchParams(
      Object.entries(params).filter(([, v]) => v)
    ).toString();
    return request("GET", `/products${q ? `?${q}` : ""}`);
  },
  get: (id) => request("GET", `/products/${id}`),
  create: (data) => request("POST", "/products", data),
  categories: () => request("GET", "/products/categories/list"),
};

export const rentals = {
  list: () => request("GET", "/rentals"),
  my: () => request("GET", "/rentals/my"),
  create: (data) => request("POST", "/rentals", data),
  pickup: (id) => request("PATCH", `/rentals/${id}/pickup`),
  return: (id) => request("PATCH", `/rentals/${id}/return`),
};

export const reviews = {
  create: (data) => request("POST", "/reviews", data),
  byUser: (userId) => request("GET", `/reviews/user/${userId}`),
  pending: () => request("GET", "/reviews/pending"),
};

export const users = {
  get: (id) => request("GET", `/users/${id}`),
  updateProfile: (data) => request("PATCH", "/users/profile", data),
  submitKyc: (data) => request("POST", "/users/kyc", data),
  generateQr: (data) => request("POST", "/users/generate-qr", data),
  validateQr: (data) => request("POST", "/users/validate-qr", data),
};
