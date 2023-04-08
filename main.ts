import * as core from "@actions/core";
import * as exc from "@actions/exec";
import * as io from "@actions/io";
import * as tc from "@actions/tool-cache";
import * as restm from "typed-rest-client/RestClient";

const process = require("process");

async function run() {
  let version = await latestVersion();
  let warpBin = await download(version);
  core.addPath(warpBin);
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

interface Release {
  tag_name: string;
}

async function latestVersion(): Promise<string> {
  let client = new restm.RestClient("setup-warp", "", [], {
    headers: { Authorization: `Bearer ${repoToken()}` },
  });

  let releaseUrl = "https://api.github.com/repos/warp-build/warp/releases";
  let results = (await client.get<Array<Release>>(releaseUrl)).result || [];
  let latestTag = results[0].tag_name;

  return latestTag;
}

async function download(version: string): Promise<string> {
  let url =
    `https://github.com/warp-build/warp/releases/download/${version}/warp-${version}-${hostTriple()}.tar.gz`;

  let downloadPath = await tc.downloadTool(url);

  let extPath: string = downloadPath + "-extracted";
  await io.mkdirP(extPath);
  await exc.exec(`tar`, ["xzf", downloadPath], { cwd: extPath });

  let cachePath = await tc.cacheDir(extPath, "warp", version);

  return cachePath;
}

run();
