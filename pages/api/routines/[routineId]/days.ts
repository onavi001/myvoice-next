import { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import { dbConnect } from "../../../../lib/mongodb";
import Routine from "../../../../models/Routine";
import Day from "../../../../models/Day";
import Exercise from "../../../../models/Exercise";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No autenticado" });

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET || "my-super-secret-key") as { userId: string };
  } catch (error) {
    return res.status(401).json({ message: "Token inválido" });
  }

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
          exercises: exerciseIds.map((id: any) => ({
            _id: id.toString(),
            name: exercises.find((e: any) => e._id?.toString() === id.toString())?.name || "",
            sets: exercises.find((e: any) => e._id?.toString() === id.toString())?.sets || 0,
            reps: exercises.find((e: any) => e._id?.toString() === id.toString())?.reps || 0,
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