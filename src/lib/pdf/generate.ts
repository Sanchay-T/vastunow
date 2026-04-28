import { renderToBuffer } from '@react-pdf/renderer';
import fs from 'node:fs';
import path from 'node:path';
import VastuReportDocument from './VastuReportDocument';
import type { VastuReportProps, PdfAssets } from './VastuReportDocument';

export type { VastuReportProps };

let cachedAssets: PdfAssets | null = null;

function getAssets(): PdfAssets {
  if (cachedAssets) return cachedAssets;
  const root = process.cwd();
  cachedAssets = {
    logoLockup: fs.readFileSync(path.join(root, 'public/images/logo-full-maroon.png')),
    mascot: fs.readFileSync(path.join(root, 'public/images/mascot.png')),
    compass: fs.readFileSync(path.join(root, 'public/images/compass-maroon.png')),
  };
  return cachedAssets;
}

export async function generatePdfBuffer(props: Omit<VastuReportProps, 'assets'>): Promise<Buffer> {
  const buffer = await renderToBuffer(VastuReportDocument({ ...props, assets: getAssets() }));
  return Buffer.from(buffer);
}
