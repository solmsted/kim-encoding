# kim-encoding

A JavaScript implementation of Douglas Crockford's Kim encoding specification - a simple and efficient encoding that delivers 7 bits per byte.

## About Kim Encoding

Kim (Keep It Minimal) encoding is a variable-length encoding scheme invented by Douglas Crockford. It efficiently encodes integers and Unicode strings while maintaining simplicity. The encoding uses 7 bits per byte, with the high bit used as a continuation flag.

**Original Specification**: [https://www.crockford.com/kim.html](https://www.crockford.com/kim.html)

### Key Features

- **Efficient**: Uses 7 bits per byte with minimal overhead
- **Simple**: Straightforward encoding/decoding algorithm
- **Versatile**: Handles BigInts, numbers, and Unicode strings
- **Compact**: Variable-length encoding adapts to value size
- **Unicode-aware**: Properly handles all Unicode characters including surrogate pairs

## Installation

```bash
npm install kim-encoding
```

## Usage

```javascript
import _kimEncoding from 'kim-encoding';

{
    // Encode various types
    const encodedBigInt = _kimEncoding.encodeBigInt(123456789n),
        encodedNumber = _kimEncoding.encodeNumber(42),
        encodedString = _kimEncoding.encodeString('Hello, 世界! 🌍'),

        // Decode back to original values
        decodedBigInt = _kimEncoding.decodeBigInt(encodedBigInt),
        decodedNumber = _kimEncoding.decodeNumber(encodedNumber),
        decodedString = _kimEncoding.decodeString(encodedString),

        // Auto-detect type and encode
        encoded = _kimEncoding.encode('Hello'), // Encodes a string
        encoded2 = _kimEncoding.encode(12345), // Encodes a number
        encoded3 = _kimEncoding.encode(999n), // Encodes a BigInt

        // Encode arrays of numbers or BigInts
        numbers = [1, 2, 3, 100, 1000],
        encodedArray = _kimEncoding.encodeIterable(numbers),
        decodedArray = _kimEncoding.decodeNumberArray(encodedArray);
}
```

## API Reference

### Encoding Functions

#### `encode(value)`
Automatically encodes based on the value type (BigInt, number, string, or iterable).

#### `encodeBigInt(value)`
Encodes a BigInt value to a Uint8Array.

#### `encodeIterable(value)`
Encodes an iterable of numbers or BigInts to a Uint8Array.

#### `encodeNumber(value)`
Encodes an integer number to a Uint8Array. Throws if the value is not an integer.

#### `encodeString(value)`
Encodes a Unicode string to a Uint8Array. Properly handles all Unicode characters.

### Decoding Functions

#### `decodeBigInt(bytes)`
Decodes a Uint8Array (or compatible) to a single BigInt value.

#### `decodeBigIntArray(bytes)`
Decodes a Uint8Array to an array of BigInt values.

#### `decodeNumber(bytes)`
Decodes a Uint8Array to a single number. Throws if the value exceeds safe integer bounds.

#### `decodeNumberArray(bytes)`
Decodes a Uint8Array to an array of numbers.

#### `decodeString(bytes)`
Decodes a Uint8Array to a Unicode string.

### Input Formats

The decoding functions accept various input formats:
- `Uint8Array`
- `ArrayBuffer`
- `Buffer` (Node.js)
- Regular arrays of numbers

## Examples

### Encoding Numbers and BigInts

```javascript
// Small positive numbers use minimal bytes
_kimEncoding.encode(127); // 1 byte
_kimEncoding.encode(128); // 2 bytes

// Negative numbers are supported
_kimEncoding.encode(-42); // 2 bytes

// BigInts for values outside safe integer range
_kimEncoding.encode(2n ** 60n); // BigInt encoding
```

### Encoding Strings

```javascript
// ASCII characters use 1 byte each
_kimEncoding.encodeString('Hello');

// Unicode characters use 2-3 bytes
_kimEncoding.encodeString('你好'); // Chinese
_kimEncoding.encodeString('مرحبا'); // Arabic
_kimEncoding.encodeString('🚀🌟'); // Emoji

// Complex Unicode is handled correctly
_kimEncoding.encodeString('café'); // Combined characters
_kimEncoding.encodeString('👨‍👩‍👧‍👦'); // Multi-codepoint emoji
```

### Working with Arrays

```javascript
// Encode multiple values efficiently
const data = [1, 100, 1000, 10000],
    encoded = _kimEncoding.encodeIterable(data),

    decoded = _kimEncoding.decodeNumberArray(encoded),

    bigData = [123n, 456n, 789n],
    encodedBig = _kimEncoding.encodeIterable(bigData),

    decodedBig = _kimEncoding.decodeBigIntArray(encodedBig);
```

### Error Handling

```javascript
try {
    // Non-integer numbers throw
    _kimEncoding.encodeNumber(3.14);
} catch (error) {
    console.error('Must be an integer');
}

try {
    // Values outside safe range throw when decoding to number
    const huge = _kimEncoding.encodeBigInt(2n ** 60n);

    _kimEncoding.decodeNumber(huge);
} catch (error) {
    console.error('Value outside safe integer range');
}
```

## How Kim Encoding Works

Kim encoding uses a variable-length scheme where:
- Each byte uses 7 bits for data
- The high bit (bit 7) indicates continuation:
  - `1` = more bytes follow
  - `0` = this is the last byte
- Integers are encoded in big-endian order
- Negative numbers use a special prefix byte (128)
- Strings are encoded as UTF-32 code points, then each code point is encoded as an integer

This design makes Kim encoding simple to implement while remaining efficient for common use cases.

## Attribution

Kim encoding was invented by Douglas Crockford. This is an independent implementation of his specification.

## License

This implementation is licensed under the zlib/libpng license. See LICENSE.md for details.

## Contributing

Issues and pull requests are welcome! Please ensure all tests pass and add new tests for any new functionality.

## See Also

- [Original Kim Specification](https://www.crockford.com/kim.html)
