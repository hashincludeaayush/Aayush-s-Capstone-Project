import mongoose, { Model, Schema } from "mongoose";

export type AnalyzedReportDoc = {
  productId?: string;
  productUrl?: string;
  // The workflow can store arbitrary fields (deal_score, competitor_snapshot, etc).
  [key: string]: any;
};

const analyzedReportSchema = new Schema<AnalyzedReportDoc>(
  {
    productId: { type: String, index: true },
    productUrl: { type: String, index: true },
  },
  {
    collection: "analyzed",
    strict: false,
    timestamps: true,
  }
);

export function getAnalyzedReportModel(): Model<AnalyzedReportDoc> {
  // Uses the same Mongo cluster connection, but switches DB context.
  const analyzedDb = mongoose.connection.useDb("analyzed");

  return (
    (analyzedDb.models.AnalyzedReport as Model<AnalyzedReportDoc> | undefined) ??
    analyzedDb.model<AnalyzedReportDoc>("AnalyzedReport", analyzedReportSchema)
  );
}
