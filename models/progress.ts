import { Schema, model, Document, Types, Model } from "mongoose";

interface IProgress extends Document {
  userId: Types.ObjectId;
  routineId: Types.ObjectId;
  dayId: string;
  exerciseId: string;
  sets: number;
  reps: number;
  weight: string;
  notes: string;
  date: Date;
}

const ProgressSchema: Schema = new Schema<IProgress>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  routineId: { type: Schema.Types.ObjectId, ref: "Routine", required: true },
  dayId: { type: String, required: true },
  exerciseId: { type: String, required: true },
  sets: { type: Number },
  reps: { type: Number },
  weight: { type: String },
  notes: { type: String },
  date: { type: Date, default: Date.now },
});

let ProgressModel: Model<IProgress>;

try {
  ProgressModel = model<IProgress>("Progress", ProgressSchema);
} catch (e) {
  ProgressModel = model<IProgress>("Progress", ProgressSchema, undefined, { overwriteModels: true });
}

export default ProgressModel;