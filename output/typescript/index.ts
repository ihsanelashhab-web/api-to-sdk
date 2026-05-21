// Auto-generated SDK for Demo API v1.0.0
// Do not edit manually

const BASE_URL = "https://api.example.com/v1";

let _apiKey: string | null = null;
let _bearerToken: string | null = null;

export function setApiKey(key: string): void {
  _apiKey = key;
}

export function setBearerToken(token: string): void {
  _bearerToken = token;
}

async function sleep(ms: number): Promise<void> {
  return new Promise(resolve => setTimeout(resolve, ms));
}

async function request(method: string, path: string, body?: any, params?: Record<string, any>, retries = 3): Promise<any> {
  let url = BASE_URL + path;
  if (params) {
    const query = new URLSearchParams(params).toString();
    if (query) url += "?" + query;
  }
  const headers: Record<string, string> = { "Content-Type": "application/json" };
  if (_apiKey) headers["X-API-Key"] = _apiKey;
  if (_bearerToken) headers["Authorization"] = "Bearer " + _bearerToken;
  for (let attempt = 1; attempt <= retries; attempt++) {
    try {
      const res = await fetch(url, {
        method,
        headers,
        body: body ? JSON.stringify(body) : undefined,
      });
      if (res.status === 429 || res.status >= 500) {
        if (attempt < retries) { await sleep(attempt * 1000); continue; }
      }
      if (!res.ok) throw new Error("API Error: " + res.status + " " + res.statusText);
      return res.json();
    } catch (err) {
      if (attempt === retries) throw err;
      await sleep(attempt * 1000);
    }
  }
}

/** Fetch all pages automatically */
export async function paginate(fn: (page: number) => Promise<any>, maxPages = 10): Promise<any[]> {
  const results: any[] = [];
  for (let page = 1; page <= maxPages; page++) {
    const data = await fn(page);
    if (!data || (Array.isArray(data) && data.length === 0)) break;
    if (Array.isArray(data)) results.push(...data);
    else if (data.data) results.push(...data.data);
    else { results.push(data); break; }
  }
  return results;
}

/** Get all users */
export async function getUsers(params?: Record<string, any>): Promise<any> {
  return request("GET", `/users`, undefined, params);
}

/** Create a new user */
export async function createUser(body?: Record<string, any>): Promise<any> {
  return request("POST", `/users`, body);
}

/** Get user by ID */
export async function getUserById(id: string): Promise<any> {
  return request("GET", `/users/${id}`);
}

/** Get all products */
export async function getProducts(): Promise<any> {
  return request("GET", `/products`);
}
