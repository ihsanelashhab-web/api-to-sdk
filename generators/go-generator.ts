import fs from "fs";
import path from "path";
import { ApiSpec, Endpoint } from "../parsers/openapi-parser";

export function generateGoSDK(spec: ApiSpec, outputDir: string): void {
  fs.mkdirSync(outputDir, { recursive: true });

  const lines: string[] = [];

  lines.push(`// Auto-generated SDK for ${spec.title} v${spec.version}`);
  lines.push(`// Do not edit manually\n`);
  lines.push(`package sdk\n`);
  lines.push(`import (`);
  lines.push(`  "bytes"`);
  lines.push(`  "encoding/json"`);
  lines.push(`  "fmt"`);
  lines.push(`  "io"`);
  lines.push(`  "net/http"`);
  lines.push(`  "time"`);
  lines.push(`)\n`);
  lines.push(`const baseURL = "${spec.baseUrl}"\n`);
  lines.push(`type Client struct {`);
  lines.push(`  apiKey      string`);
  lines.push(`  bearerToken string`);
  lines.push(`  httpClient  *http.Client`);
  lines.push(`}\n`);
  lines.push(`func NewClient() *Client {`);
  lines.push(`  return &Client{httpClient: &http.Client{Timeout: 30 * time.Second}}`);
  lines.push(`}\n`);
  lines.push(`func (c *Client) SetApiKey(key string) { c.apiKey = key }`);
  lines.push(`func (c *Client) SetBearerToken(token string) { c.bearerToken = token }\n`);
  lines.push(`func (c *Client) request(method, path string, body interface{}) (map[string]interface{}, error) {`);
  lines.push(`  var reqBody io.Reader`);
  lines.push(`  if body != nil {`);
  lines.push(`    data, _ := json.Marshal(body)`);
  lines.push(`    reqBody = bytes.NewBuffer(data)`);
  lines.push(`  }`);
  lines.push(`  req, err := http.NewRequest(method, baseURL+path, reqBody)`);
  lines.push(`  if err != nil { return nil, err }`);
  lines.push(`  req.Header.Set("Content-Type", "application/json")`);
  lines.push(`  if c.apiKey != "" { req.Header.Set("X-API-Key", c.apiKey) }`);
  lines.push(`  if c.bearerToken != "" { req.Header.Set("Authorization", "Bearer "+c.bearerToken) }`);
  lines.push(`  res, err := c.httpClient.Do(req)`);
  lines.push(`  if err != nil { return nil, err }`);
  lines.push(`  defer res.Body.Close()`);
  lines.push(`  if res.StatusCode >= 400 {`);
  lines.push(`    return nil, fmt.Errorf("API Error: %d", res.StatusCode)`);
  lines.push(`  }`);
  lines.push(`  var result map[string]interface{}`);
  lines.push(`  json.NewDecoder(res.Body).Decode(&result)`);
  lines.push(`  return result, nil`);
  lines.push(`}\n`);

  spec.endpoints.forEach((endpoint: Endpoint) => {
    const fnName = endpoint.operationId.charAt(0).toUpperCase() + endpoint.operationId.slice(1);
    const pathParams = endpoint.parameters.filter(p => p.in === "path");

    const args: string[] = [];
    pathParams.forEach(p => args.push(`${p.name} string`));
    if (endpoint.requestBody) args.push(`body map[string]interface{}`);

    let route = endpoint.route;
    pathParams.forEach(p => {
      route = route.replace(`{${p.name}}`, `%s`);
    });

    const routeStr = pathParams.length > 0
      ? `fmt.Sprintf("${route}", ${pathParams.map(p => p.name).join(", ")})`
      : `"${route}"`;

    lines.push(`// ${endpoint.summary}`);
    lines.push(`func (c *Client) ${fnName}(${args.join(", ")}) (map[string]interface{}, error) {`);

    if (endpoint.requestBody) {
      lines.push(`  return c.request("${endpoint.method}", ${routeStr}, body)`);
    } else {
      lines.push(`  return c.request("${endpoint.method}", ${routeStr}, nil)`);
    }

    lines.push(`}\n`);
  });

  const outputPath = path.join(outputDir, "sdk.go");
  fs.writeFileSync(outputPath, lines.join("\n"), "utf-8");
  console.log(`✅ Go SDK generated at: ${outputPath}`);
}