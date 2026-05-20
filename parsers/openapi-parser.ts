import fs from "fs";

const filePath = "./examples/openapi.json";

try {
  const rawData = fs.readFileSync(filePath, "utf-8");
  const apiSpec = JSON.parse(rawData);

  console.log("API Title:", apiSpec.info?.title);
  console.log("API Version:", apiSpec.info?.version);

  console.log("\nEndpoints:");

  const paths = apiSpec.paths || {};

  for (const route in paths) {
    const methods = Object.keys(paths[route]);

    methods.forEach((method) => {
      console.log(`${method.toUpperCase()} ${route}`);
    });
  }
} catch (error) {
  console.error("Error reading OpenAPI file:", error);
}