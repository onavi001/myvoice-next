import { Schema, model, Model } from "mongoose";

export interface IProgress {
  userId: Schema.Types.ObjectId;
  routineId: Schema.Types.ObjectId;
  dayIndex: number;
  exerciseIndex: number;
  sets: number;
  reps: number;
  weightUnit: "kg" | "lb";
  weight: string;
  notes: string;
  date: Date;
}
export interface ProgressData {
  _id: string;
  userId: string; // Serializado desde Schema.Types.ObjectId
  routineId: string; // Serializado desde Schema.Types.ObjectId
  dayIndex: number;
  exerciseIndex: number;
  sets: number;
  reps: number;
  weightUnit: "kg" | "lb";
  weight: string;
  notes: string;
  date: Date;
}

const ProgressSchema: Schema = new Schema<IProgress>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  routineId: { type: Schema.Types.ObjectId, ref: "Routine", required: true },
  dayIndex: { type: Number, required: true },
  exerciseIndex: { type: Number, required: true },
  sets: { type: Number, required: true },
  reps: { type: Number, required: true },
  weightUnit: { type: String, enum: ["kg", "lb"], default: "kg" },
  weight: { type: String, default: "" },
  notes: { type: String, default: "" },
  date: { type: Date, default: Date.now },
});

let ProgressModel: Model<IProgress>;

try {
  ProgressModel = model<IProgress>("Progress", ProgressSchema);
} catch (e) {
  ProgressModel = model<IProgress>("Progress", ProgressSchema, undefined, { overwriteModels: true });
}

export default ProgressModel;