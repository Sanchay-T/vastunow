import { renderToBuffer } from '@react-pdf/renderer';
import VastuReportDocument from './VastuReportDocument';
import type { VastuReportProps } from './VastuReportDocument';

export type { VastuReportProps };

export async function generatePdfBuffer(props: VastuReportProps): Promise<Buffer> {
  const buffer = await renderToBuffer(VastuReportDocument(props));
  return Buffer.from(buffer);
}
