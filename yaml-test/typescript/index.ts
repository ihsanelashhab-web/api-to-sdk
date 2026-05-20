// Auto-generated SDK for Demo API v1.0.0
// Do not edit manually

const BASE_URL = "https://api.example.com/v1";

async function request(method: string, path: string, body?: any, params?: Record<string, any>): Promise<any> {
  let url = BASE_URL + path;
  if (params) {
    const query = new URLSearchParams(params).toString();
    if (query) url += "?" + query;
  }
  const res = await fetch(url, {
    method,
    headers: { "Content-Type": "application/json" },
    body: body ? JSON.stringify(body) : undefined,
  });
  return res.json();
}

/** Get all users */
export async function getUsers(params?: Record<string, any>): Promise<any> {
  return request("GET", `/users`, undefined, params);
}

/** Get all products */
export async function getProducts(): Promise<any> {
  return request("GET", `/products`);
}
