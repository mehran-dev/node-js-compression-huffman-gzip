const fs = require("fs");
const path = require("path");

// Helper function to build the Huffman tree and generate Huffman codes
function buildHuffmanTree(data) {
  const frequency = {};

  // Count the frequency of each byte
  for (const byte of data) {
    frequency[byte] = (frequency[byte] || 0) + 1;
  }

  // Create a priority queue (min-heap) of nodes
  const heap = Object.keys(frequency).map((byte) => ({
    byte,
    frequency: frequency[byte],
    left: null,
    right: null,
  }));

  // Build the Huffman tree
  while (heap.length > 1) {
    heap.sort((a, b) => a.frequency - b.frequency); // Sort by frequency
    const left = heap.shift();
    const right = heap.shift();

    const newNode = {
      byte: null, // Internal node doesn't have a byte
      frequency: left.frequency + right.frequency,
      left,
      right,
    };

    heap.push(newNode);
  }

  // Generate Huffman codes from the tree
  const codes = {};
  function generateCodes(node, currentCode = "") {
    if (node.left === null && node.right === null) {
      codes[node.byte] = currentCode;
      return;
    }

    if (node.left) generateCodes(node.left, currentCode + "0");
    if (node.right) generateCodes(node.right, currentCode + "1");
  }

  generateCodes(heap[0]);

  return { tree: heap[0], codes };
}

// Helper function to compress the file using Huffman coding
function compressFile(inputPath) {
  const data = fs.readFileSync(inputPath);
  const { tree, codes } = buildHuffmanTree(data);

  // Encode the file content using the Huffman codes
  let encoded = "";
  for (const byte of data) {
    encoded += codes[byte];
  }

  // Split the encoded string into bytes (8 bits per byte)
  const buffer = [];
  for (let i = 0; i < encoded.length; i += 8) {
    const byte = encoded.slice(i, i + 8).padEnd(8, "0"); // Ensure byte is 8 bits
    buffer.push(parseInt(byte, 2));
  }

  const compressedFilePath = path.join(
    path.dirname(inputPath),
    path.basename(inputPath) + ".compressed"
  );
  const treeFilePath = path.join(
    path.dirname(inputPath),
    path.basename(inputPath) + ".tree.txt"
  );

  // Save the compressed file (binary data)
  fs.writeFileSync(compressedFilePath, Buffer.from(buffer));

  // Save the Huffman tree as a JSON object
  fs.writeFileSync(treeFilePath, JSON.stringify(tree, null, 2));

  console.log("File compressed successfully");
  return { compressedFilePath, treeFilePath };
}

// Helper function to decode the compressed file
function decodeFile(compressedFilePath, treeFilePath) {
  const compressedData = fs.readFileSync(compressedFilePath);
  const tree = JSON.parse(fs.readFileSync(treeFilePath, "utf8"));

  // Rebuild the Huffman tree from the saved JSON
  let node = tree;
  let decodedData = [];

  // Decode the binary string back to the original content
  let bitString = "";
  compressedData.forEach((byte) => {
    bitString += byte.toString(2).padStart(8, "0"); // Convert byte to 8-bit binary
  });

  for (let i = 0; i < bitString.length; i++) {
    node = bitString[i] === "0" ? node.left : node.right;

    if (node.left === null && node.right === null) {
      decodedData.push(node.byte);
      node = tree; // Reset back to root for the next byte
    }
  }

  // Save the decoded file
  const decodedFilePath = compressedFilePath.replace(".compressed", ".decoded");
  fs.writeFileSync(decodedFilePath, Buffer.from(decodedData));

  console.log("File decoded successfully");
}

// Example usage:
// Compressing a file
const { compressedFilePath, treeFilePath } = compressFile("./assets/1.mp4"); // Replace with your file path

// Decoding the compressed file
decodeFile(compressedFilePath, treeFilePath);
