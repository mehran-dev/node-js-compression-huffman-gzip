const zlib = require("zlib");
const fs = require("fs");

// Compress a file
function compressWithZlib(inputPath, outputPath) {
  const readStream = fs.createReadStream(inputPath);
  const writeStream = fs.createWriteStream(outputPath);

  const gzip = zlib.createGzip();
  readStream.pipe(gzip).pipe(writeStream);

  writeStream.on("close", () => {
    console.log("Compression complete");
  });

  writeStream.on("error", (err) => {
    console.error("Write Stream Error:", err);
  });

  readStream.on("error", (err) => {
    console.error("Read Stream Error:", err);
  });

  gzip.on("error", (err) => {
    console.error("Gzip Error:", err);
  });
}

// Decompress a file
function decompressWithZlib(inputPath, outputPath) {
  const readStream = fs.createReadStream(inputPath);
  const writeStream = fs.createWriteStream(outputPath);

  const gunzip = zlib.createGunzip();
  readStream.pipe(gunzip).pipe(writeStream);

  writeStream.on("close", () => {
    console.log("Decompression complete");
  });

  writeStream.on("error", (err) => {
    console.error("Write Stream Error:", err);
  });

  readStream.on("error", (err) => {
    console.error("Read Stream Error:", err);
  });

  gunzip.on("error", (err) => {
    console.error("Gunzip Error:", err);
  });
}

// Usage
const inputFile = "./assets/1.mp4";
compressWithZlib(inputFile, `${inputFile}.gz`);
// we need to wait for compressWithZlib before decompressing
decompressWithZlib(`${inputFile}.gz`, `${inputFile}.decoded`);
