const { ZipArchive } = require("archiver");
const fs = require("fs");
const path = require("path");

const d = new Date();
const date = d
  .toLocaleDateString("en-US", {
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  })
  .replace(/\//g, "-");
const time = d
  .toLocaleTimeString("en-US", {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  })
  .replace(/\s/g, "")
  .replace(/:/g, "-");
const outputName = `raahi-${date}-${time}.zip`;

const output = fs.createWriteStream(path.join(__dirname, outputName));
const archive = new ZipArchive({ zlib: { level: 9 } });

output.on("close", () => {
  console.log(
    `✅ Created: ${outputName} (${(archive.pointer() / 1024 / 1024).toFixed(2)} MB)`,
  );
});

archive.on("error", (err) => {
  throw err;
});
archive.on("warning", (err) => {
  if (err.code !== "ENOENT") throw err;
});

archive.pipe(output);

const ignore = [
  "**/node_modules/**",
  "**/.git/**",
  "**/.vscode/**",
  "**/.angular/**",
  "**/dist/**",
  "**/*.log",
  "**/zips/**",
  "**/*.zip",
];

// Include root files needed to bootstrap after extraction
archive.file(path.join(__dirname, "package.json"), { name: "package.json" });
archive.file(path.join(__dirname, "zip.js"), { name: "zip.js" });
archive.file(path.join(__dirname, "setup.js"), { name: "setup.js" });

archive.glob(
  "**/*",
  { cwd: path.join(__dirname, "frontend-main"), ignore, dot: true },
  { prefix: "frontend-main" },
);
archive.glob(
  "**/*",
  { cwd: path.join(__dirname, "backend-main"), ignore, dot: true },
  { prefix: "backend-main" },
);

archive.finalize();
