"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
require("dotenv/config");
const express_1 = __importDefault(require("express"));
const multer_1 = __importDefault(require("multer"));
const cors_1 = __importDefault(require("cors"));
const fs_1 = __importDefault(require("fs"));
const path_1 = __importDefault(require("path"));
const openapi_parser_1 = require("./parsers/openapi-parser");
const typescript_generator_1 = require("./generators/typescript-generator");
const python_generator_1 = require("./generators/python-generator");
const dart_generator_1 = require("./generators/dart-generator");
const go_generator_1 = require("./generators/go-generator");
const java_generator_1 = require("./generators/java-generator");
const app = (0, express_1.default)();
const storage = multer_1.default.diskStorage({
    destination: "uploads/",
    filename: (_req, file, cb) => {
        cb(null, Date.now() + "-" + file.originalname);
    }
});
const upload = (0, multer_1.default)({ storage });
app.use((0, cors_1.default)());
app.use(express_1.default.json());
app.post("/generate", upload.single("file"), (req, res) => {
    try {
        if (!req.file) {
            return res.status(400).json({ error: "No file uploaded" });
        }
        const langs = req.body.langs
            ? JSON.parse(req.body.langs)
            : ["typescript"];
        const inputPath = req.file.path;
        const outputDir = path_1.default.join("temp-output", Date.now().toString());
        const spec = (0, openapi_parser_1.parseOpenApi)(inputPath);
        if (langs.includes("typescript"))
            (0, typescript_generator_1.generateTypeScriptSDK)(spec, path_1.default.join(outputDir, "typescript"));
        if (langs.includes("python"))
            (0, python_generator_1.generatePythonSDK)(spec, path_1.default.join(outputDir, "python"));
        if (langs.includes("dart"))
            (0, dart_generator_1.generateDartSDK)(spec, path_1.default.join(outputDir, "dart"));
        if (langs.includes("go"))
            (0, go_generator_1.generateGoSDK)(spec, path_1.default.join(outputDir, "go"));
        if (langs.includes("java"))
            (0, java_generator_1.generateJavaSDK)(spec, path_1.default.join(outputDir, "java"));
        // جمع كل الملفات المولّدة
        const files = {};
        const collectFiles = (dir, prefix = "") => {
            if (!fs_1.default.existsSync(dir))
                return;
            fs_1.default.readdirSync(dir).forEach(f => {
                const fullPath = path_1.default.join(dir, f);
                if (fs_1.default.statSync(fullPath).isDirectory()) {
                    collectFiles(fullPath, prefix + f + "/");
                }
                else {
                    files[prefix + f] = fs_1.default.readFileSync(fullPath, "utf-8");
                }
            });
        };
        collectFiles(outputDir);
        // تنظيف الملفات المؤقتة
        fs_1.default.rmSync(inputPath, { force: true });
        fs_1.default.rmSync(outputDir, { recursive: true, force: true });
        res.json({
            success: true,
            title: spec.title,
            version: spec.version,
            endpoints: spec.endpoints.length,
            files,
        });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.post("/generate-docs", upload.single("file"), async (req, res) => {
    try {
        if (!req.file)
            return res.status(400).json({ error: "No file uploaded" });
        const { generateAIDocs } = await Promise.resolve().then(() => __importStar(require("./generators/doc-generator")));
        const spec = (0, openapi_parser_1.parseOpenApi)(req.file.path);
        const docs = await generateAIDocs(spec);
        fs_1.default.rmSync(req.file.path, { force: true });
        res.json({ success: true, docs });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
// رفع عدة ملفات دفعة واحدة
app.post("/generate-batch", upload.array("files", 20), async (req, res) => {
    try {
        const files = req.files;
        if (!files || files.length === 0) {
            return res.status(400).json({ error: "No files uploaded" });
        }
        // API Change Detection
        app.post("/detect-changes", upload.fields([
            { name: "oldFile", maxCount: 1 },
            { name: "newFile", maxCount: 1 }
        ]), async (req, res) => {
            try {
                const files = req.files;
                if (!files.oldFile || !files.newFile) {
                    return res.status(400).json({ error: "Please upload both old and new API files" });
                }
                const { detectChanges } = await Promise.resolve().then(() => __importStar(require("./utils/change-detector")));
                const oldSpec = (0, openapi_parser_1.parseOpenApi)(files.oldFile[0].path);
                const newSpec = (0, openapi_parser_1.parseOpenApi)(files.newFile[0].path);
                const report = detectChanges(oldSpec, newSpec);
                fs_1.default.rmSync(files.oldFile[0].path, { force: true });
                fs_1.default.rmSync(files.newFile[0].path, { force: true });
                res.json({ success: true, report });
            }
            catch (error) {
                res.status(500).json({ error: error.message });
            }
        });
        const langs = req.body.langs ? JSON.parse(req.body.langs) : ["typescript"];
        const results = [];
        for (const file of files) {
            try {
                const spec = (0, openapi_parser_1.parseOpenApi)(file.path);
                const outputDir = path_1.default.join("temp-output", Date.now().toString());
                if (langs.includes("typescript"))
                    (0, typescript_generator_1.generateTypeScriptSDK)(spec, path_1.default.join(outputDir, "typescript"));
                if (langs.includes("python"))
                    (0, python_generator_1.generatePythonSDK)(spec, path_1.default.join(outputDir, "python"));
                if (langs.includes("dart"))
                    (0, dart_generator_1.generateDartSDK)(spec, path_1.default.join(outputDir, "dart"));
                if (langs.includes("go"))
                    (0, go_generator_1.generateGoSDK)(spec, path_1.default.join(outputDir, "go"));
                if (langs.includes("java"))
                    (0, java_generator_1.generateJavaSDK)(spec, path_1.default.join(outputDir, "java"));
                const generatedFiles = {};
                const collectFiles = (dir, prefix = "") => {
                    if (!fs_1.default.existsSync(dir))
                        return;
                    fs_1.default.readdirSync(dir).forEach(f => {
                        const fullPath = path_1.default.join(dir, f);
                        if (fs_1.default.statSync(fullPath).isDirectory()) {
                            collectFiles(fullPath, prefix + f + "/");
                        }
                        else {
                            generatedFiles[prefix + f] = fs_1.default.readFileSync(fullPath, "utf-8");
                        }
                    });
                };
                collectFiles(outputDir);
                fs_1.default.rmSync(file.path, { force: true });
                fs_1.default.rmSync(outputDir, { recursive: true, force: true });
                results.push({
                    filename: file.originalname,
                    success: true,
                    title: spec.title,
                    version: spec.version,
                    endpoints: spec.endpoints.length,
                    files: generatedFiles,
                });
            }
            catch (err) {
                results.push({
                    filename: file.originalname,
                    success: false,
                    error: err.message,
                });
            }
        }
        res.json({ success: true, total: files.length, results });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
app.get("/health", (req, res) => {
    res.json({ status: "ok", name: "SDKCraft API" });
});
// API Change Detection
app.post("/detect-changes", upload.fields([
    { name: "oldFile", maxCount: 1 },
    { name: "newFile", maxCount: 1 }
]), async (req, res) => {
    try {
        const files = req.files;
        if (!files.oldFile || !files.newFile) {
            return res.status(400).json({ error: "Please upload both old and new API files" });
        }
        const { detectChanges } = await Promise.resolve().then(() => __importStar(require("./utils/change-detector")));
        const oldSpec = (0, openapi_parser_1.parseOpenApi)(files.oldFile[0].path);
        const newSpec = (0, openapi_parser_1.parseOpenApi)(files.newFile[0].path);
        const report = detectChanges(oldSpec, newSpec);
        fs_1.default.rmSync(files.oldFile[0].path, { force: true });
        fs_1.default.rmSync(files.newFile[0].path, { force: true });
        res.json({ success: true, report });
    }
    catch (error) {
        res.status(500).json({ error: error.message });
    }
});
const PORT = 4000;
app.listen(PORT, () => {
    console.log(`✅ SDKCraft API running on http://localhost:${PORT}`);
});
