"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.generateTypeScriptSDK = generateTypeScriptSDK;
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
function generateModels(models) {
    const lines = [];
    models.forEach(model => {
        lines.push(`export interface ${model.name} {`);
        model.fields.forEach(field => {
            const optional = !field.required ? "?" : "";
            const nullable = field.nullable ? " | null" : "";
            lines.push(`  ${field.name}${optional}: ${field.type}${nullable};`);
        });
        lines.push(`}\n`);
    });
    return lines;
}
function generateTypeScriptSDK(spec, outputDir) {
    fs_1.default.mkdirSync(outputDir, { recursive: true });
    const lines = [];
    lines.push(`// Auto-generated SDK for ${spec.title} v${spec.version}`);
    lines.push(`// Do not edit manually\n`);
    lines.push(`const BASE_URL = "${spec.baseUrl}";\n`);
    lines.push(`let _apiKey: string | null = null;`);
    lines.push(`let _bearerToken: string | null = null;\n`);
    lines.push(`export function setApiKey(key: string): void {`);
    lines.push(`  _apiKey = key;`);
    lines.push(`}\n`);
    lines.push(`export function setBearerToken(token: string): void {`);
    lines.push(`  _bearerToken = token;`);
    lines.push(`}\n`);
    // Models
    if (spec.models.length > 0) {
        lines.push(`// ---- Models ----\n`);
        generateModels(spec.models).forEach(l => lines.push(l));
    }
    lines.push(`async function sleep(ms: number): Promise<void> {`);
    lines.push(`  return new Promise(resolve => setTimeout(resolve, ms));`);
    lines.push(`}\n`);
    lines.push(`async function request<T>(method: string, path: string, body?: Record<string, unknown>, params?: Record<string, string>, retries = 3): Promise<T> {`);
    lines.push(`  let url = BASE_URL + path;`);
    lines.push(`  if (params) {`);
    lines.push(`    const query = new URLSearchParams(params).toString();`);
    lines.push(`    if (query) url += "?" + query;`);
    lines.push(`  }`);
    lines.push(`  const headers: Record<string, string> = { "Content-Type": "application/json" };`);
    lines.push(`  if (_apiKey) headers["X-API-Key"] = _apiKey;`);
    lines.push(`  if (_bearerToken) headers["Authorization"] = "Bearer " + _bearerToken;`);
    lines.push(`  for (let attempt = 1; attempt <= retries; attempt++) {`);
    lines.push(`    try {`);
    lines.push(`      const res = await fetch(url, {`);
    lines.push(`        method,`);
    lines.push(`        headers,`);
    lines.push(`        body: body ? JSON.stringify(body) : undefined,`);
    lines.push(`      });`);
    lines.push(`      if (res.status === 429 || res.status >= 500) {`);
    lines.push(`        if (attempt < retries) { await sleep(attempt * 1000); continue; }`);
    lines.push(`      }`);
    lines.push(`      if (!res.ok) throw new Error(\`API Error \${res.status}: \${res.statusText}\`);`);
    lines.push(`      return res.json() as Promise<T>;`);
    lines.push(`    } catch (err) {`);
    lines.push(`      if (attempt === retries) throw err;`);
    lines.push(`      await sleep(attempt * 1000);`);
    lines.push(`    }`);
    lines.push(`  }`);
    lines.push(`  throw new Error("Request failed after " + retries + " retries");`);
    lines.push(`}\n`);
    lines.push(`/** Fetch all pages automatically */`);
    lines.push(`export async function paginate<T>(fn: (page: number) => Promise<T[]>, maxPages = 10): Promise<T[]> {`);
    lines.push(`  const results: T[] = [];`);
    lines.push(`  for (let page = 1; page <= maxPages; page++) {`);
    lines.push(`    const data = await fn(page);`);
    lines.push(`    if (!data || data.length === 0) break;`);
    lines.push(`    results.push(...data);`);
    lines.push(`  }`);
    lines.push(`  return results;`);
    lines.push(`}\n`);
    // Endpoints
    spec.endpoints.forEach((endpoint) => {
        const fnName = endpoint.operationId;
        const pathParams = endpoint.parameters.filter(p => p.in === "path");
        const queryParams = endpoint.parameters.filter(p => p.in === "query");
        // تحديد الـ return type
        const returnType = endpoint.responseModel || "unknown";
        const args = [];
        pathParams.forEach(p => args.push(`${p.name}: ${p.type === "integer" ? "number" : "string"}`));
        if (queryParams.length > 0)
            args.push(`params?: Record<string, string>`);
        if (endpoint.requestBodyModel) {
            args.push(`body?: ${endpoint.requestBodyModel}`);
        }
        else if (endpoint.requestBody) {
            args.push(`body?: Record<string, unknown>`);
        }
        let route = endpoint.route;
        pathParams.forEach(p => {
            route = route.replace(`{${p.name}}`, `\${${p.name}}`);
        });
        lines.push(`/** ${endpoint.summary} */`);
        lines.push(`export async function ${fnName}(${args.join(", ")}): Promise<${returnType}> {`);
        if (queryParams.length > 0 && endpoint.requestBody) {
            lines.push(`  return request<${returnType}>("${endpoint.method}", \`${route}\`, body, params);`);
        }
        else if (queryParams.length > 0) {
            lines.push(`  return request<${returnType}>("${endpoint.method}", \`${route}\`, undefined, params);`);
        }
        else if (endpoint.requestBody) {
            lines.push(`  return request<${returnType}>("${endpoint.method}", \`${route}\`, body as Record<string, unknown>);`);
        }
        else {
            lines.push(`  return request<${returnType}>("${endpoint.method}", \`${route}\`);`);
        }
        lines.push(`}\n`);
    });
    const outputPath = path_1.default.join(outputDir, "index.ts");
    fs_1.default.writeFileSync(outputPath, lines.join("\n"), "utf-8");
    console.log(`✅ TypeScript SDK generated at: ${outputPath}`);
}
