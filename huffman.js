class Node {
  constructor(char, freq, left = null, right = null) {
    this.char = char; // Character
    this.freq = freq; // Frequency
    this.left = left; // Left child
    this.right = right; // Right child
  }
}

// Build frequency map
function buildFrequencyMap(text) {
  const freqMap = new Map();
  for (const char of text) {
    freqMap.set(char, (freqMap.get(char) || 0) + 1);
  }
  return freqMap;
}

// Build Huffman Tree
function buildHuffmanTree(freqMap) {
  const nodes = Array.from(freqMap.entries()).map(
    ([char, freq]) => new Node(char, freq)
  );

  while (nodes.length > 1) {
    nodes.sort((a, b) => a.freq - b.freq); // Sort by frequency

    const left = nodes.shift(); // Remove two smallest
    const right = nodes.shift();

    const mergedNode = new Node(null, left.freq + right.freq, left, right);
    nodes.push(mergedNode);
  }

  return nodes[0]; // Root of the tree
}

// Generate Huffman Codes
function generateHuffmanCodes(root, path = "", codes = {}) {
  if (!root) return;

  if (root.char !== null) {
    codes[root.char] = path; // Assign code for the character
  }

  generateHuffmanCodes(root.left, path + "0", codes); // Traverse left
  generateHuffmanCodes(root.right, path + "1", codes); // Traverse right

  return codes;
}

// Encode text
function encode(text, codes) {
  return text
    .split("")
    .map((char) => codes[char])
    .join("");
}

// Decode binary string
function decode(encodedText, root) {
  let decoded = "";
  let current = root;

  for (const bit of encodedText) {
    current = bit === "0" ? current.left : current.right;

    if (current.char) {
      decoded += current.char;
      current = root; // Reset to root
    }
  }

  return decoded;
}

// Main function
function huffmanCoding(text) {
  const freqMap = buildFrequencyMap(text);
  const huffmanTree = buildHuffmanTree(freqMap);
  const huffmanCodes = generateHuffmanCodes(huffmanTree);

  const encodedText = encode(text, huffmanCodes);
  const decodedText = decode(encodedText, huffmanTree);

  console.log("Original Text:", text);
  console.log("Huffman Codes:", huffmanCodes);
  console.log("Encoded Text:", encodedText);
  console.log("Decoded Text:", decodedText);
}

// Example Usage
const text = "huffman coding is awesome!";
huffmanCoding(text);
