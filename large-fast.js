async function compressFile(inputPath) {
  const frequency = await calculateFrequencies(inputPath);
  const { tree, codes } = buildHuffmanTree(frequency);

  const compressedFilePath = `${inputPath}.compressed`;
  const treeFilePath = `${inputPath}.tree.txt`;

  const writeStream = fs.createWriteStream(compressedFilePath);
  const readStream = fs.createReadStream(inputPath);

  let buffer = [];
  let bitString = "";

  for await (const chunk of readStream) {
    for (const byte of chunk) {
      bitString += codes[byte];
      while (bitString.length >= 8) {
        buffer.push(parseInt(bitString.slice(0, 8), 2));
        bitString = bitString.slice(8);
      }

      // Write in bulk to reduce I/O operations
      if (buffer.length > 1024) {
        writeStream.write(Buffer.from(buffer));
        buffer = [];
      }
    }
  }

  // Handle remaining bits
  if (bitString.length > 0) {
    bitString = bitString.padEnd(8, "0");
    buffer.push(parseInt(bitString, 2));
  }

  // Write the final buffer
  if (buffer.length > 0) {
    writeStream.write(Buffer.from(buffer));
  }

  writeStream.end();
  fs.writeFileSync(treeFilePath, JSON.stringify(tree));

  console.log("File compressed successfully");
  return { compressedFilePath, treeFilePath };
}
