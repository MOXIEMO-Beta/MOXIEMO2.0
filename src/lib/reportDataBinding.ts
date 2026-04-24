/**
 * Builds the normalized report data shape consumed by the PDF/report renderer.
 * Stub implementation — extend with real field mapping as the report contract solidifies.
 */
export function buildReportData(strategyRow: any, profileRow: any): any {
  if (!strategyRow) return null;
  return {
    profile: profileRow ?? null,
    strategy: strategyRow,
  };
}