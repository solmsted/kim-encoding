import _Error from 'isotropic-error';

const _kimEncoding = {
    decodeBigInt (bytes) {
        const uint8Array = _kimEncoding._bytesToUint8Array(bytes);

        if (uint8Array.length === 0) {
            return 0n;
        }

        return _kimEncoding._decodeBigInt(uint8Array, 0).value;
    },
    decodeBigIntArray (bytes) {
        const uint8Array = _kimEncoding._bytesToUint8Array(bytes),
            values = [];

        if (uint8Array.length === 0) {
            return values;
        }

        let byteIndex = 0;

        do {
            const result = _kimEncoding._decodeBigInt(uint8Array, byteIndex);

            byteIndex = result.byteIndex;
            values.push(result.value);
        } while (byteIndex < uint8Array.length);

        return values;
    },
    decodeNumber (bytes) {
        return _kimEncoding._bigIntToNumber(_kimEncoding.decodeBigInt(bytes));
    },
    decodeNumberArray (bytes) {
        return _kimEncoding.decodeBigIntArray(bytes).map(value => _kimEncoding._bigIntToNumber(value));
    },
    decodeString (bytes) {
        return String.fromCodePoint(..._kimEncoding.decodeNumberArray(bytes));
    },
    encode (value) {
        switch (typeof value) {
            case 'bigint':
                return _kimEncoding.encodeBigInt(value);
            case 'number':
                return _kimEncoding.encodeNumber(value);
            case 'string':
                return _kimEncoding.encodeString(value);
        }

        if (value?.[Symbol.iterator]) {
            return _kimEncoding.encodeIterable(value);
        }

        throw _Error({
            details: {
                typeReceived: typeof value
            },
            message: 'Value must be a bigint, number, or string',
            name: 'TypeError'
        });
    },
    encodeBigInt (value) {
        const bytes = [];

        if (value === 0n) {
            bytes.push(0);
        } else {
            const negative = value < 0n;

            if (negative) {
                value = -value;
            }

            let temp = value;

            while (temp > 0n) {
                bytes.push(Number(temp & 127n));
                temp >>= 7n;
            }

            for (let index = bytes.length - 1; index > 0; index -= 1) {
                bytes[index] |= 128;
            }

            bytes.reverse();

            if (negative) {
                bytes.unshift(128);
            }
        }

        return new Uint8Array(bytes);
    },
    encodeIterable (value) {
        const chunks = [];

        let totalLength = 0;

        for (const item of value) {
            let chunk;

            switch (typeof item) {
                case 'bigint':
                    chunk = _kimEncoding.encodeBigInt(item);
                    break;
                case 'number':
                    chunk = _kimEncoding.encodeNumber(item);
                    break;
                default:
                    throw _Error({
                        details: {
                            typeReceived: typeof item
                        },
                        message: 'Iterable value must be a bigint or number',
                        name: 'TypeError'
                    });
            }

            chunks.push(chunk);
            totalLength += chunk.length;
        }

        {
            const result = new Uint8Array(totalLength);

            let offset = 0;

            for (const chunk of chunks) {
                result.set(chunk, offset);
                offset += chunk.length;
            }

            return result;
        }
    },
    encodeNumber (value) {
        if (Number.isInteger(value)) {
            return _kimEncoding.encodeBigInt(BigInt(value));
        }

        throw _Error({
            details: {
                value
            },
            message: 'Number value must be an integer',
            name: 'TypeError'
        });
    },
    encodeString (value) {
        const bytes = [],
            length = value.length;

        for (let index = 0; index < length; index += 1) {
            const codePoint = value.codePointAt(index);

            if (codePoint <= 127) {
                // 1 byte: 0xxxxxxx
                bytes.push(codePoint);
            } else if (codePoint <= 16383) {
                // 2 bytes: 1xxxxxxx 0xxxxxxx
                bytes.push(
                    128 | codePoint >> 7,
                    codePoint & 127
                );
            } else {
                // 3 bytes: 1xxxxxxx 1xxxxxxx 0xxxxxxx
                bytes.push(
                    128 | codePoint >> 14,
                    128 | codePoint >> 7 & 127,
                    codePoint & 127
                );

                if (codePoint > 65535) {
                    // Skip surrogate pair
                    index += 1;
                }
            }
        }

        return new Uint8Array(bytes);
    },
    _bigIntToNumber (value) {
        if (value >= _kimEncoding._minimumSafeInteger && value <= _kimEncoding._maximumSafeInteger) {
            return Number(value);
        }

        throw _Error({
            details: {
                maximumSafeInteger: _kimEncoding._maximumSafeInteger,
                minimumSafeInteger: _kimEncoding._minimumSafeInteger,
                value
            },
            message: 'Value is outside safe integer range',
            name: 'RangeError'
        });
    },
    _bytesToUint8Array (bytes) {
        if (bytes instanceof ArrayBuffer || !(bytes instanceof Uint8Array)) {
            return new Uint8Array(bytes);
        }

        return bytes;
    },
    _decodeBigInt (uint8Array, byteIndex) {
        if (uint8Array[byteIndex] === 128) {
            byteIndex += 1;

            if (byteIndex >= uint8Array.length) {
                throw _Error({
                    message: 'Invalid negative Kim encoding'
                });
            }

            switch (uint8Array[byteIndex]) {
                case 0:
                case 128:
                    throw _Error({
                        message: 'Invalid negative Kim encoding'
                    });
            }

            const result = _kimEncoding._decodeUnsignedBigInt(uint8Array, byteIndex);

            result.value = -result.value;

            return result;
        }

        return _kimEncoding._decodeUnsignedBigInt(uint8Array, byteIndex);
    },
    _decodeUnsignedBigInt (uint8Array, byteIndex) {
        let byte,
            value = 0n;

        do {
            if (byteIndex >= uint8Array.length) {
                throw _Error({
                    message: 'Incomplete Kim sequence'
                });
            }

            byte = uint8Array[byteIndex];
            byteIndex += 1;
            value = value << 7n | BigInt(byte & 127);
        } while (byte & 128);

        return {
            byteIndex,
            value
        };
    },
    _maximumSafeInteger: BigInt(Number.MAX_SAFE_INTEGER),
    _minimumSafeInteger: BigInt(Number.MIN_SAFE_INTEGER)
};

export default _kimEncoding;
