import { Schema, model, Document, Types, Model } from "mongoose";

interface IRoutine extends Document {
  userId: Types.ObjectId;
  name: string;
  days: {
    dayName: string;
    musclesWorked: string[];
    warmupOptions: string[];
    explanation: string;
    exercises: {
      name: string;
      muscleGroup: string;
      sets: number;
      reps: number;
      weight: string;
      rest: string;
      tips: string[];
      completed: boolean;
      videos: { url: string; isCurrent: boolean }[];
    }[];
  }[];
  createdAt: Date;
  updatedAt: Date;
}

const RoutineSchema: Schema = new Schema<IRoutine>({
  userId: { type: Schema.Types.ObjectId, ref: "User", required: true },
  name: { type: String, required: true },
  days: [
    {
      dayName: { type: String, required: true },
      musclesWorked: [String],
      warmupOptions: [String],
      explanation: String,
      exercises: [
        {
          name: { type: String, required: true },
          muscleGroup: String,
          sets: Number,
          reps: Number,
          weight: String,
          rest: String,
          tips: [String],
          completed: { type: Boolean, default: false },
          videos: [{ url: String, isCurrent: Boolean }],
        },
      ],
    },
  ],
  createdAt: { type: Date, default: Date.now },
  updatedAt: { type: Date, default: Date.now },
});

let RoutineModel: Model<IRoutine>;

try {
  RoutineModel = model<IRoutine>("Routine", RoutineSchema);
} catch (e) {
  RoutineModel = model<IRoutine>("Routine", RoutineSchema, undefined, { overwriteModels: true });
}

export default RoutineModel;