import { Schema, model, Model, Types } from "mongoose";
import { IVideo } from "./Video";

export interface IExercise {
  name: string;
  muscleGroup: string;
  sets: number;
  reps: number;
  weight: string;
  rest: string;
  tips: string[];
  completed: boolean;
  //videos: IVideo[];
  videos: IVideo[] | Types.ObjectId[];
  notes?: string;
}

const ExerciseSchema: Schema = new Schema<IExercise>({
  name: { type: String, required: true },
  muscleGroup: String,
  sets: Number,
  reps: Number,
  weight: String,
  rest: String,
  tips: [String],
  completed: { type: Boolean, default: false },
  videos: [{ type: Schema.Types.ObjectId, ref: "Video" }],
  notes: String,
});

let ExerciseModel: Model<IExercise>;

try {
  ExerciseModel = model<IExercise>("Exercise", ExerciseSchema);
} catch (e) {
  ExerciseModel = model<IExercise>("Exercise", ExerciseSchema, undefined, { overwriteModels: true });
}

export default ExerciseModel;