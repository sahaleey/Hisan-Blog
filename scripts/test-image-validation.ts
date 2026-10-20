import assert from "node:assert/strict";
import test from "node:test";
import { deflateSync } from "node:zlib";
import { MAX_IMAGE_BYTES, validateImageBytes } from "@/lib/image-validation";

const jpeg = Uint8Array.from(Buffer.from(
  "/9j/4AAQSkZJRgABAQAAAQABAAD/2wBDAP//////////////////////////////////////////////////////////////////////////////////////2wBDAf//////////////////////////////////////////////////////////////////////////////////////wAARCAABAAEDASIAAhEBAxEB/8QAFQABAQAAAAAAAAAAAAAAAAAAAAf/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oADAMBAAIQAxAAAAH/xAAUEAEAAAAAAAAAAAAAAAAAAAAA/9oACAEBAAEFAqf/xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAEDAQE/AX//xAAUEQEAAAAAAAAAAAAAAAAAAAAA/9oACAECAQE/Af/EABQQAQAAAAAAAAAAAAAAAAAAACD/2gAIAQEAAT8hP//Z",
  "base64",
));

function crc32(bytes: Uint8Array) {
  let crc = 0xffffffff;
  for (const byte of bytes) {
    crc ^= byte;
    for (let bit = 0; bit < 8; bit++) crc = (crc >>> 1) ^ (0xedb88320 & -(crc & 1));
  }
  return (crc ^ 0xffffffff) >>> 0;
}

function chunk(type: string, data: Uint8Array) {
  const typeBytes = Uint8Array.from(type, (character) => character.charCodeAt(0));
  const crcBytes = new Uint8Array(4);
  const crc = crc32(new Uint8Array([...typeBytes, ...data]));
  new DataView(crcBytes.buffer).setUint32(0, crc);
  const output = new Uint8Array(12 + data.length);
  new DataView(output.buffer).setUint32(0, data.length);
  output.set(typeBytes, 4);
  output.set(data, 8);
  output.set(crcBytes, 8 + data.length);
  return output;
}

function png(size = 68) {
  const signature = Uint8Array.from([0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a]);
  const header = new Uint8Array(13);
  new DataView(header.buffer).setUint32(0, 1);
  new DataView(header.buffer).setUint32(4, 1);
  header.set([8, 6, 0, 0, 0], 8);
  const data = Uint8Array.from(deflateSync(Uint8Array.from([0, 255, 0, 0, 255])));
  const base = [signature, chunk("IHDR", header), chunk("IDAT", data)];
  const fillerSize = size - base.reduce((total, item) => total + item.length, 0) - 24;
  const filler = new Uint8Array(Math.max(0, fillerSize));
  filler.set([112, 97, 100, 0]);
  const output = new Uint8Array([...base.flatMap((item) => [...item]), ...chunk("tEXt", filler), ...chunk("IEND", new Uint8Array())]);
  return output;
}

test("accepts valid JPEG under 1 MiB", () => {
  assert.equal(validateImageBytes(jpeg, "cover.jpg", "image/jpeg").contentType, "image/jpeg");
});

test("accepts valid PNG at exactly 1 MiB", () => {
  assert.equal(validateImageBytes(png(MAX_IMAGE_BYTES), "cover.png", "image/png").contentType, "image/png");
});

test("rejects images larger than 1 MiB", () => {
  assert.throws(() => validateImageBytes(png(MAX_IMAGE_BYTES + 1), "cover.png", "image/png"), /1 MiB/);
});

test("rejects renamed WebP, SVG, and GIF files", () => {
  assert.throws(() => validateImageBytes(Uint8Array.from(Buffer.from("RIFFxxxxWEBP")), "cover.png", "image/png"));
  assert.throws(() => validateImageBytes(Uint8Array.from(Buffer.from("<svg/>")), "cover.png", "image/png"));
  assert.throws(() => validateImageBytes(Uint8Array.from([0x47, 0x49, 0x46, 0x38]), "cover.png", "image/png"));
});

test("rejects MIME, extension, and signature mismatches", () => {
  assert.throws(() => validateImageBytes(jpeg, "cover.png", "image/png"));
});

test("rejects empty and malformed images", () => {
  assert.throws(() => validateImageBytes(new Uint8Array(), "cover.jpg", "image/jpeg"));
  assert.throws(() => validateImageBytes(Uint8Array.from([0xff, 0xd8, 0xff, 0xd9]), "cover.jpg", "image/jpeg"));
});
