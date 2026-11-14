const BASE32 = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ234567';

function decodeBase32(value: string): Uint8Array | null {
  const bytes: number[] = [];
  let buffer = 0;
  let bits = 0;

  for (const character of value) {
    const digit = BASE32.indexOf(character);
    if (digit < 0) return null;
    buffer = (buffer << 5) | digit;
    bits += 5;
    if (bits >= 8) {
      bits -= 8;
      bytes.push((buffer >> bits) & 0xff);
      buffer &= (1 << bits) - 1;
    }
  }

  return bits === 0 ? Uint8Array.from(bytes) : null;
}

function crc16Xmodem(bytes: Uint8Array): number {
  let crc = 0;
  for (const byte of bytes) {
    crc ^= byte << 8;
    for (let bit = 0; bit < 8; bit++) {
      crc = (crc & 0x8000) ? ((crc << 1) ^ 0x1021) & 0xffff : (crc << 1) & 0xffff;
    }
  }
  return crc;
}

/** Validate a Stellar account StrKey, including its version byte and checksum. */
export function isValidStellarAccount(value: string): boolean {
  if (!/^G[A-Z2-7]{55}$/.test(value)) return false;
  const decoded = decodeBase32(value);
  if (!decoded || decoded.length !== 35 || decoded[0] !== 48) return false;
  const checksum = crc16Xmodem(decoded.subarray(0, 33));
  return decoded[33] === (checksum & 0xff) && decoded[34] === ((checksum >> 8) & 0xff);
}
