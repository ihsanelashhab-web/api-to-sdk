import fs from "fs";
import yaml from "js-yaml";

// هيكل يمثل كل endpoint
export interface Endpoint {
  method: string;
  route: string;
  operationId: string;
  summary: string;
  parameters: Parameter[];
  requestBody: string | null;
  responses: string[];
}

export interface Parameter {
  name: string;
  in: string; // query, path, header
  required: boolean;
  type: string;
}

export interface ApiSpec {
  title: string;
  version: string;
  baseUrl: string;
  endpoints: Endpoint[];
}

export function parseOpenApi(filePath: string): ApiSpec {
  const rawData = fs.readFileSync(filePath, "utf-8");
const spec = filePath.endsWith(".yaml") || filePath.endsWith(".yml")
  ? yaml.load(rawData) as any
  : JSON.parse(rawData);

  const endpoints: Endpoint[] = [];
  const paths = spec.paths || {};

  for (const route in paths) {
    for (const method in paths[route]) {
      const op = paths[route][method];

      // استخرج البارامترات
      const parameters: Parameter[] = (op.parameters || []).map((p: any) => ({
        name: p.name,
        in: p.in,
        required: p.required || false,
        type: p.schema?.type || "string",
      }));

      // استخرج الـ responses
      const responses = Object.keys(op.responses || {});

      // استخرج الـ requestBody إن وجد
      const requestBody = op.requestBody
        ? JSON.stringify(op.requestBody?.content)
        : null;

      endpoints.push({
        method: method.toUpperCase(),
        route,
        operationId: op.operationId || `${method}_${route.replace(/\//g, "_")}`,
        summary: op.summary || "",
        parameters,
        requestBody,
        responses,
      });
    }
  }

  return {
    title: spec.info?.title || "Unknown API",
    version: spec.info?.version || "1.0.0",
    baseUrl: spec.servers?.[0]?.url || "",
    endpoints,
  };
}

// تشغيل مباشر للتجربة
const result = parseOpenApi("./examples/openapi.json");
console.log("API:", result.title, "v" + result.version);
console.log("Base URL:", result.baseUrl);
console.log(`\nEndpoints (${result.endpoints.length}):`);
result.endpoints.forEach((e) => {
  console.log(`  ${e.method} ${e.route} — ${e.summary}`);
});