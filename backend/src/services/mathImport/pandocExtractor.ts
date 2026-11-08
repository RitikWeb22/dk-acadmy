/**
 * Math Import & Render System - Pandoc Server-Side DOCX Extractor (Step 2)
 *
 * Runs:
 *   pandoc -f docx -t markdown+tex_math_dollars --wrap=none --extract-media=<dir>
 *
 * If Pandoc binary is not installed or errors on host, provides seamless
 * fallback to the pure-Node JSZip OMML extractor (docxMathExtractor).
 */

import { exec } from 'child_process';
import { promisify } from 'util';
import fs from 'fs';
import path from 'path';
import os from 'os';
import crypto from 'crypto';
import { extractQuestionsFromDocxNative } from '../../utils/docxMathExtractor.js';
import { normalizeCanonicalMath } from './mathNormalizer.js';

const execAsync = promisify(exec);

export interface PandocExtractionResult {
  markdown: string;
  mediaFiles: string[];
  usedPandoc: boolean;
  warnings: string[];
}

/**
 * Checks if pandoc executable is available on the host environment.
 */
export async function isPandocAvailable(): Promise<boolean> {
  try {
    await execAsync('pandoc --version');
    return true;
  } catch {
    return false;
  }
}

/**
 * Extracts markdown + LaTeX math from a DOCX buffer using Pandoc with pure-Node OMML fallback.
 */
export async function extractDocxToMarkdown(
  buffer: Buffer,
  subject: string = 'Mathematics',
  targetExam: string = 'JEE Main'
): Promise<PandocExtractionResult> {
  const warnings: string[] = [];
  const tempDir = path.join(os.tmpdir(), `pandoc-import-${crypto.randomBytes(8).toString('hex')}`);
  const docxPath = path.join(tempDir, 'document.docx');
  const mediaDir = path.join(tempDir, 'media');

  try {
    fs.mkdirSync(tempDir, { recursive: true });
    fs.writeFileSync(docxPath, buffer);

    const hasPandoc = await isPandocAvailable();

    if (hasPandoc) {
      try {
        const cmd = `pandoc -f docx -t markdown+tex_math_dollars --wrap=none --extract-media="${mediaDir}" "${docxPath}"`;
        const { stdout } = await execAsync(cmd, { maxBuffer: 50 * 1024 * 1024 });

        // Collect extracted media filenames
        let mediaFiles: string[] = [];
        if (fs.existsSync(mediaDir)) {
          mediaFiles = fs.readdirSync(mediaDir);
        }

        const normalizedMarkdown = normalizeCanonicalMath(stdout);

        return {
          markdown: normalizedMarkdown,
          mediaFiles,
          usedPandoc: true,
          warnings
        };
      } catch (pandocErr: any) {
        warnings.push(`Pandoc conversion failed: ${pandocErr.message}. Used pure-Node OMML fallback.`);
      }
    } else {
      warnings.push('Pandoc CLI is not installed on this host. Used pure-Node OMML fallback.');
    }

    // Pure-Node OMML fallback
    const nativeResult = await extractQuestionsFromDocxNative(buffer, subject, targetExam);
    const paragraphs: string[] = [];

    if (nativeResult.questions && nativeResult.questions.length > 0) {
      for (const q of nativeResult.questions) {
        let qText = `Q${q.qNum}. ${q.statement}\n`;
        if (q.options && q.options.length > 0) {
          for (const opt of q.options) {
            qText += `(${opt.key}) ${opt.text}\n`;
          }
        }
        if (q.correctAnswer) {
          qText += `Ans: ${q.correctAnswer}\n`;
        }
        paragraphs.push(qText);
      }
    }

    const fallbackMarkdown = normalizeCanonicalMath(paragraphs.join('\n\n'));

    return {
      markdown: fallbackMarkdown,
      mediaFiles: [],
      usedPandoc: false,
      warnings
    };
  } finally {
    // Cleanup temporary files
    try {
      if (fs.existsSync(tempDir)) {
        fs.rmSync(tempDir, { recursive: true, force: true });
      }
    } catch {
      // Ignore cleanup error
    }
  }
}
