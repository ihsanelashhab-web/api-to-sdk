import { parseOpenApi } from "./parsers/openapi-parser";
import { generateTypeScriptSDK } from "./generators/typescript-generator";

const spec = parseOpenApi("./examples/openapi.json");
generateTypeScriptSDK(spec, "./output/typescript");
