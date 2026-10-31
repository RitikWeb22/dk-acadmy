import fs from 'fs';

/**
 * Validates actual binary content (magic bytes) against declared file extension
 * Prevents file extension spoofing attacks (e.g. php/html disguised as jpg/png)
 */
export function verifyMagicBytes(filePath: string, ext: string): boolean {
  if (!fs.existsSync(filePath)) return false;

  const fd = fs.openSync(filePath, 'r');
  const buffer = Buffer.alloc(16);
  fs.readSync(fd, buffer, 0, 16, 0);
  fs.closeSync(fd);

  const cleanExt = ext.toLowerCase().replace('.', '');

  switch (cleanExt) {
    case 'jpg':
    case 'jpeg':
      // JPEG starts with FF D8 FF
      return buffer[0] === 0xff && buffer[1] === 0xd8 && buffer[2] === 0xff;

    case 'png':
      // PNG starts with 89 50 4E 47
      return buffer[0] === 0x89 && buffer[1] === 0x50 && buffer[2] === 0x4e && buffer[3] === 0x47;

    case 'webp':
      // WebP starts with RIFF and has WEBP at byte offset 8
      return (
        buffer.subarray(0, 4).toString('ascii') === 'RIFF' &&
        buffer.subarray(8, 12).toString('ascii') === 'WEBP'
      );

    case 'gif':
      // GIF starts with GIF87a or GIF89a
      return buffer.subarray(0, 3).toString('ascii') === 'GIF';

    case 'pdf':
      // PDF starts with %PDF (25 50 44 46)
      return buffer.subarray(0, 4).toString('ascii') === '%PDF';

    case 'mp4':
    case 'mov':
      // ISO base media file format (MP4/MOV) contains ftyp or moov at offset 4
      return (
        buffer.subarray(4, 8).toString('ascii') === 'ftyp' ||
        buffer.subarray(4, 8).toString('ascii') === 'moov'
      );

    case 'webm':
    case 'mkv':
      // EBML header 1A 45 DF A3
      return buffer[0] === 0x1a && buffer[1] === 0x45 && buffer[2] === 0xdf && buffer[3] === 0xa3;

    case 'docx':
      // DOCX is a zip container starting with PK (50 4B 03 04)
      return buffer[0] === 0x50 && buffer[1] === 0x4b && buffer[2] === 0x03 && buffer[3] === 0x04;

    default:
      return false;
  }
}
