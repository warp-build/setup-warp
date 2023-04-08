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
var __importStar = (this && this.__importStar) || function (mod) {
    if (mod && mod.__esModule) return mod;
    var result = {};
    if (mod != null) for (var k in mod) if (k !== "default" && Object.prototype.hasOwnProperty.call(mod, k)) __createBinding(result, mod, k);
    __setModuleDefault(result, mod);
    return result;
};
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const core = __importStar(require("@actions/core"));
const exc = __importStar(require("@actions/exec"));
const io = __importStar(require("@actions/io"));
const tc = __importStar(require("@actions/tool-cache"));
const restm = __importStar(require("typed-rest-client/RestClient"));
const process = require("process");
function run() {
    return __awaiter(this, void 0, void 0, function* () {
        let version = yield latestVersion();
        let warpBin = yield download(version);
        core.addPath(warpBin);
    });
}
function repoToken() {
    return core.getInput("repo-token");
}
function hostTriple() {
    let arch;
    switch (process.arch) {
        case "arm64":
            arch = "aarch64";
            break;
        case "x64":
            arch = "x86_64";
            break;
        default:
            throw new Error(`Unsupported architecture ${process.arch}.`);
    }
    let platform;
    switch (process.platform) {
        case "linux":
            platform = "unknown-linux-gnu";
            break;
        case "darwin":
            platform = "apple-darwin";
            break;
        default:
            throw new Error(`Unsupported platform ${process.platform}.`);
    }
    return `${arch}-${platform}`;
}
function latestVersion() {
    return __awaiter(this, void 0, void 0, function* () {
        let client = new restm.RestClient("setup-warp", "", [], {
            headers: { Authorization: `Bearer ${repoToken()}` },
        });
        let releaseUrl = "https://api.github.com/repos/warp-build/warp/releases";
        let results = (yield client.get(releaseUrl)).result || [];
        let latestTag = results[0].tag_name;
        return latestTag;
    });
}
function download(version) {
    return __awaiter(this, void 0, void 0, function* () {
        let url = `https://github.com/warp-build/warp/releases/download/${version}/warp-${version}-${hostTriple()}.tar.gz`;
        let downloadPath = yield tc.downloadTool(url);
        let extPath = downloadPath + "-extracted";
        yield io.mkdirP(extPath);
        yield exc.exec(`tar`, ["xzf", downloadPath], { cwd: extPath });
        let cachePath = yield tc.cacheDir(extPath, "warp", version);
        return cachePath;
    });
}
run();
