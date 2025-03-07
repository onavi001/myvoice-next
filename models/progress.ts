// models/Progress.ts
import mongoose, { Schema, Document } from "mongoose";

export interface IProgress extends Document {
  routineId: string;
  dayIndex: number;
  exerciseIndex: number;
  sets: number;
  reps: number;
  weight: string;
  notes: string;
  date: string;
  userId: string;
}

const ProgressSchema: Schema = new Schema(
  {
    routineId: { type: String, required: true },
    dayIndex: { type: Number, required: true },
    exerciseIndex: { type: Number, required: true },
    sets: { type: Number, required: true },
    reps: { type: Number, required: true },
    weight: { type: String, required: true },
    notes: { type: String, default: "" },
    date: { type: String, required: true },
    userId: { type: String, required: true },
  },
  { timestamps: true }
);

export default mongoose.models.Progress || mongoose.model<IProgress>("Progress", ProgressSchema);