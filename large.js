const fs = require("fs");
const path = require("path");
const readline = require("readline");

// Helper function to build the Huffman tree and generate Huffman codes
function buildHuffmanTree(frequency) {
  const heap = Object.keys(frequency).map((byte) => ({
    byte,
    frequency: frequency[byte],
    left: null,
    right: null,
  }));

  while (heap.length > 1) {
    heap.sort((a, b) => a.frequency - b.frequency);
    const left = heap.shift();
    const right = heap.shift();

    const newNode = {
      byte: null,
      frequency: left.frequency + right.frequency,
      left,
      right,
    };

    heap.push(newNode);
  }

  const tree = heap[0];
  const codes = {};
  function generateCodes(node, currentCode = "") {
    if (node.left === null && node.right === null) {
      codes[node.byte] = currentCode;
      return;
    }
    if (node.left) generateCodes(node.left, currentCode + "0");
    if (node.right) generateCodes(node.right, currentCode + "1");
  }
  generateCodes(tree);

  return { tree, codes };
}

// Function to calculate byte frequencies in chunks
async function calculateFrequencies(filePath) {
  const frequency = {};
  const stream = fs.createReadStream(filePath);
  for await (const chunk of stream) {
    for (const byte of chunk) {
      frequency[byte] = (frequency[byte] || 0) + 1;
    }
  }
  return frequency;
}

// Compress a large file
async function compressFile0(inputPath) {
  const frequency = await calculateFrequencies(inputPath);
  const { tree, codes } = buildHuffmanTree(frequency);

  const compressedFilePath = `${inputPath}.compressed`;
  const treeFilePath = `${inputPath}.tree.txt`;

  const writeStream = fs.createWriteStream(compressedFilePath);
  const readStream = fs.createReadStream(inputPath);

  let encoded = "";
  for await (const chunk of readStream) {
    for (const byte of chunk) {
      encoded += codes[byte];
      while (encoded.length >= 8) {
        const byteStr = encoded.slice(0, 8);
        writeStream.write(Buffer.from([parseInt(byteStr, 2)]));
        encoded = encoded.slice(8);
      }
    }
  }
  if (encoded.length > 0) {
    encoded = encoded.padEnd(8, "0");
    writeStream.write(Buffer.from([parseInt(encoded, 2)]));
  }

  writeStream.end();
  fs.writeFileSync(treeFilePath, JSON.stringify(tree));

  console.log("File compressed successfully");
  return { compressedFilePath, treeFilePath };
}

async function compressFile_slow(inputPath) {
  const frequency = await calculateFrequencies(inputPath);
  const { tree, codes } = buildHuffmanTree(frequency);

  const compressedFilePath = `${inputPath}.compressed`;
  const treeFilePath = `${inputPath}.tree.txt`;

  const writeStream = fs.createWriteStream(compressedFilePath);
  const readStream = fs.createReadStream(inputPath);

  let buffer = ""; // Temporary buffer to accumulate bits

  for await (const chunk of readStream) {
    for (const byte of chunk) {
      buffer += codes[byte];
      // Write full bytes to the file
      while (buffer.length >= 8) {
        const byteStr = buffer.slice(0, 8);
        writeStream.write(Buffer.from([parseInt(byteStr, 2)]));
        buffer = buffer.slice(8); // Remove written bits
      }
    }
  }

  // Handle remaining bits in the buffer
  if (buffer.length > 0) {
    buffer = buffer.padEnd(8, "0"); // Pad remaining bits to form a full byte
    writeStream.write(Buffer.from([parseInt(buffer, 2)]));
  }

  writeStream.end();
  fs.writeFileSync(treeFilePath, JSON.stringify(tree));

  console.log("File compressed successfully");
  return { compressedFilePath, treeFilePath };
}

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

// Decode a large file
async function decodeFile(compressedFilePath, treeFilePath) {
  const tree = JSON.parse(fs.readFileSync(treeFilePath, "utf8"));
  const decodedFilePath = compressedFilePath.replace(".compressed", ".decoded");

  const readStream = fs.createReadStream(compressedFilePath);
  const writeStream = fs.createWriteStream(decodedFilePath);

  let node = tree;
  let bitString = "";
  for await (const chunk of readStream) {
    for (const byte of chunk) {
      bitString += byte.toString(2).padStart(8, "0");
      while (bitString.length > 0) {
        node = bitString[0] === "0" ? node.left : node.right;
        bitString = bitString.slice(1);

        if (node.left === null && node.right === null) {
          writeStream.write(Buffer.from([node.byte]));
          node = tree;
        }
      }
    }
  }
  writeStream.end();

  console.log("File decoded successfully");
  return decodedFilePath;
}

// Example usage
(async () => {
  const inputPath = "./assets/1.mp4"; // Replace with your file path
  const { compressedFilePath, treeFilePath } = await compressFile(inputPath);
  const decodedFilePath = await decodeFile(compressedFilePath, treeFilePath);
  console.log("Decoded file saved at:", decodedFilePath);
})();
