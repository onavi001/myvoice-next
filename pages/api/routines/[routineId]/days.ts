import { NextApiRequest, NextApiResponse } from "next";
import { dbConnect } from "../../../../lib/mongodb";
import Routine from "../../../../models/Routine";
import Day, { IDay } from "../../../../models/Day";
import Exercise, { IExercise } from "../../../../models/Exercise";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No autenticado" });

  const { routineId } = req.query;

  switch (req.method) {
    case "POST":
      try {
        const { dayName, exercises } = req.body;
        const exerciseIds = [];
        for (const exData of exercises || []) {
          const exercise = new Exercise(exData);
          await exercise.save();
          exerciseIds.push(exercise._id);
        }

        const day = new Day({ dayName, exercises: exerciseIds });
        await day.save();

        await Routine.findByIdAndUpdate(routineId, { $push: { days: day._id } });

        res.status(201).json({
          _id: day._id.toString(),
          dayName: day.dayName,
          musclesWorked: day.musclesWorked || [],
          warmupOptions: day.warmupOptions || [],
          explanation: day.explanation || "",
          exercises: exerciseIds.map((id: Partial<IDay>) => ({
            _id: id.toString(),
            name: exercises.find((e: Partial<IExercise>) => e._id?.toString() === id.toString())?.name || "",
            sets: exercises.find((e: Partial<IExercise>) => e._id?.toString() === id.toString())?.sets || 0,
            reps: exercises.find((e: Partial<IExercise>) => e._id?.toString() === id.toString())?.reps || 0,
            repsUnit: exercises.find((e: Partial<IExercise>) => e._id?.toString() === id.toString())?.repsUnit || "count",
            weightUnit: exercises.find((e: Partial<IExercise>) => e._id?.toString() === id.toString())?.weightUnit || "kg",
            weight: "",
            rest: "",
            tips: [],
            completed: false,
            videos: [],
          })),
        });
      } catch (error) {
        res.status(500).json({ message: "Error al crear día", error });
      }
      break;

    default:
      res.status(405).json({ message: "Método no permitido" });
      break;
  }
}