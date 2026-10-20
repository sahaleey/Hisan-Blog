export const MAX_IMAGE_BYTES = 1_048_576;

export type ValidatedImageFormat = {
  extension: ".jpg" | ".jpeg" | ".png";
  contentType: "image/jpeg" | "image/png";
};

function ascii(bytes: Uint8Array, start: number, length: number) {
  return String.fromCharCode(...bytes.slice(start, start + length));
}

function readUint32(bytes: Uint8Array, offset: number) {
  return ((bytes[offset] << 24) | (bytes[offset + 1] << 16) | (bytes[offset + 2] << 8) | bytes[offset + 3]) >>> 0;
}

export function validateImageBytes(
  bytes: Uint8Array,
  name: string,
  contentType: string,
): ValidatedImageFormat {
  if (bytes.length === 0) throw new Error("The selected image is empty.");
  if (bytes.length > MAX_IMAGE_BYTES) throw new Error("Images must be no larger than 1 MiB.");

  const extension = name.toLowerCase().slice(name.lastIndexOf("."));
  let isJpeg = false;
  if (bytes[0] === 0xff && bytes[1] === 0xd8 && bytes.length >= 4 &&
      bytes[bytes.length - 2] === 0xff && bytes[bytes.length - 1] === 0xd9) {
    let offset = 2;
    let hasFrame = false;
    let hasScan = false;
    while (offset + 3 < bytes.length - 2) {
      if (bytes[offset] !== 0xff) break;
      const marker = bytes[offset + 1];
      offset += 2;
      if (marker === 0xda) {
        hasScan = true;
        break;
      }
      if (marker === 0xd8 || marker === 0xd9) continue;
      const segmentLength = (bytes[offset] << 8) | bytes[offset + 1];
      if (segmentLength < 2 || offset + segmentLength > bytes.length) break;
      hasFrame ||= (marker >= 0xc0 && marker <= 0xc3);
      offset += segmentLength;
    }
    isJpeg = hasFrame && hasScan;
  }
  let isPng = false;
  if (bytes.length >= 33 && ascii(bytes, 0, 8) === "\x89PNG\r\n\x1a\n") {
    let offset = 8;
    let hasHeader = false;
    let hasEnd = false;
    while (offset + 12 <= bytes.length) {
      const length = readUint32(bytes, offset);
      const type = ascii(bytes, offset + 4, 4);
      const end = offset + 12 + length;
      if (end > bytes.length) break;
      if (type === "IHDR") hasHeader = length === 13 && readUint32(bytes, offset + 8) > 0 && readUint32(bytes, offset + 12) > 0;
      if (type === "IEND" && length === 0 && end === bytes.length) {
        hasEnd = true;
        break;
      }
      offset = end;
    }
    isPng = hasHeader && hasEnd;
  }

  if (isJpeg && (extension === ".jpg" || extension === ".jpeg") && contentType === "image/jpeg") {
    return { extension: extension as ".jpg" | ".jpeg", contentType: "image/jpeg" };
  }
  if (isPng && extension === ".png" && contentType === "image/png") {
    return { extension: ".png", contentType: "image/png" };
  }
  throw new Error("Use a valid JPEG (.jpg or .jpeg) or PNG (.png) with a matching file type.");
}
