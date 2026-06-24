import { parseOpenApi, generateTypeScriptSDK, generatePythonSDK, generateDartSDK, generateGoSDK, generateJavaSDK, generateKotlinSDK, generateSwiftSDK } from "sdkcraft-core";

const spec = parseOpenApi("./examples/openapi.json");
generateTypeScriptSDK(spec, "./output/typescript");
generatePythonSDK(spec, "./output/python");
generateDartSDK(spec, "./output/dart");
generateGoSDK(spec, "./output/go");
generateJavaSDK(spec, "./output/java");
generateKotlinSDK(spec, "./output/kotlin");
generateSwiftSDK(spec, "./output/swift");