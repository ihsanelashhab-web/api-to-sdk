"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
exports.parseOpenApi = parseOpenApi;
const fs_1 = __importDefault(require("fs"));
const js_yaml_1 = __importDefault(require("js-yaml"));
function openApiTypToTs(type, format) {
    if (type === "integer" || type === "number")
        return "number";
    if (type === "boolean")
        return "boolean";
    if (type === "array")
        return "unknown[]";
    return "string";
}
function extractModels(schemas) {
    const models = [];
    for (const name in schemas) {
        const schema = schemas[name];
        if (schema.type === "object" || schema.properties) {
            const required = schema.required || [];
            const fields = [];
            for (const fieldName in schema.properties || {}) {
                const prop = schema.properties[fieldName];
                fields.push({
                    name: fieldName,
                    type: openApiTypToTs(prop.type, prop.format),
                    required: required.includes(fieldName),
                    nullable: prop.nullable || false,
                });
            }
            models.push({ name, fields });
        }
    }
    return models;
}
function resolveRef(ref) {
    return ref.replace("#/components/schemas/", "");
}
function parseOpenApi(filePath) {
    const rawData = fs_1.default.readFileSync(filePath, "utf-8");
    const spec = filePath.endsWith(".yaml") || filePath.endsWith(".yml")
        ? js_yaml_1.default.load(rawData)
        : JSON.parse(rawData);
    const schemas = spec.components?.schemas || {};
    const models = extractModels(schemas);
    const endpoints = [];
    const paths = spec.paths || {};
    for (const route in paths) {
        for (const method in paths[route]) {
            const op = paths[route][method];
            const parameters = (op.parameters || []).map((p) => ({
                name: p.name,
                in: p.in,
                required: p.required || false,
                type: p.schema?.type || "string",
            }));
            const responses = Object.keys(op.responses || {});
            const requestBody = op.requestBody
                ? JSON.stringify(op.requestBody?.content)
                : null;
            // استخرج اسم الـ model من requestBody
            let requestBodyModel = null;
            const rbRef = op.requestBody?.content?.["application/json"]?.schema?.$ref;
            if (rbRef)
                requestBodyModel = resolveRef(rbRef);
            // استخرج اسم الـ model من response
            let responseModel = null;
            const successResponse = op.responses?.["200"] || op.responses?.["201"];
            const resRef = successResponse?.content?.["application/json"]?.schema?.$ref;
            const resArrayRef = successResponse?.content?.["application/json"]?.schema?.items?.$ref;
            if (resRef)
                responseModel = resolveRef(resRef);
            else if (resArrayRef)
                responseModel = resolveRef(resArrayRef) + "[]";
            endpoints.push({
                method: method.toUpperCase(),
                route,
                operationId: op.operationId || `${method}_${route.replace(/\//g, "_")}`,
                summary: op.summary || "",
                parameters,
                requestBody,
                requestBodyModel,
                responseModel,
                responses,
            });
        }
    }
    return {
        title: spec.info?.title || "Unknown API",
        version: spec.info?.version || "1.0.0",
        baseUrl: spec.servers?.[0]?.url || "",
        endpoints,
        models,
    };
}
