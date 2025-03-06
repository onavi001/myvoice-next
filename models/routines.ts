import { Schema, model, Document, Types, Model } from "mongoose";

// Interfaces
interface IVideo {
  url: string;
  isCurrent: boolean;
}

interface IExercise {
  name: string;
  muscleGroup: string;
  sets: number;
  reps: number;
  weight: string;
  rest: string;
  tips: string[];
  completed: boolean;
  videos: IVideo[];
}

interface IDay {
  dayName: string;
  musclesWorked: string[];
  warmupOptions: string[];
  explanation: string;
  exercises: IExercise[];
}

interface IRoutine extends Document {
  userId: Types.ObjectId;
  name: string;
  days: IDay[];
  createdAt: Date;
  updatedAt: Date;
}

// Esquema
const RoutineSchema: Schema = new Schema<IRoutine>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  days: [{
    dayName: { type: String, required: true },
    musclesWorked: [{ type: String }],
    warmupOptions: [{ type: String }],
    explanation: { type: String },
    exercises: [{
      name: { type: String, required: true },
      muscleGroup: { type: String },
      sets: { type: Number },
      reps: { type: Number },
      weight: { type: String },
      rest: { type: String },
      tips: [{ type: String }],
      completed: { type: Boolean, default: false },
      videos: [{
        url: { type: String, required: true },
        isCurrent: { type: Boolean, default: false },
      }],
    }],
  }],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

// Exportar el modelo
let RoutineModel: Model<IRoutine>;

try {
  RoutineModel = model<IRoutine>("Routine", RoutineSchema);
} catch (e) {
  RoutineModel = model<IRoutine>("Routine", RoutineSchema, undefined, { overwriteModels: true });
}

export default RoutineModel;