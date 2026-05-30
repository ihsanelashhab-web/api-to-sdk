"use strict";
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
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
app.get("/health", (req, res) => {
    res.json({ status: "ok", name: "SDKCraft API" });
});
const PORT = 4000;
app.listen(PORT, () => {
    console.log(`✅ SDKCraft API running on http://localhost:${PORT}`);
});
