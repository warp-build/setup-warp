import * as core from "@actions/core";
import * as tc from "@actions/tool-cache";

async function run () {
  let version = await latestVersion();
  let warpBin = await download(version);
  core.addPath(warpBin);
};

function repoToken() {
  return core.getInput("repo-token");
}

function hostTriple() {

}

async function latestVersion(): Promise<string> {
  let client = restm.RestClient("setup-warp", "", [], {
    headers: { Authorization: `Bearer ${repoToken()}` }
  });

  let results = await client.get("https://api.github.com/repos/warp-build/warp/releases");
  let latestTag = results[0].tag_name;

  return latestTag;
}

async function download(version: string): Promise<string> {
  let url = `https://github.com/warp-build/warp/releases/download/${version}/warp-${version}-${hostTriple}.tar.gz`;

  let tarball = await tc.downloadTool(url);

  let extPath: string = downloadPath + "-extracted";
  await io.mkdirP(extPath);
  await exc.exec(`tar`, ["xzf", downloadPath], {cwd: extPath});

  let cachePath = await tc.cacheDir(extPath, "warp", version);

  return cachePath;
}

run();
