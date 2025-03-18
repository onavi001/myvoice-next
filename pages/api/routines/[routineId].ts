import { NextApiRequest, NextApiResponse } from "next";
import jwt from "jsonwebtoken";
import { dbConnect } from "../../../lib/mongodb";
import Routine from "../../../models/Routine";
import Day, { IDay } from "../../../models/Day";
import Exercise, { IExercise } from "../../../models/Exercise";
import Video, { IVideo } from "../../../models/Video";
import { Types } from "mongoose";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "No autenticado" });

  let decoded;
  try {
    decoded = jwt.verify(token, process.env.JWT_SECRET || "my-super-secret-key") as { userId: string };
  } catch {
    return res.status(401).json({ message: "Token inválido" });
  }

  const { routineId } = req.query;

  switch (req.method) {
    case "PUT":
      try {
        const { routineData } = req.body;
        console.log(routineData)
        //routine
        const routine = await Routine.findOneAndUpdate(
          { _id: routineId, userId: decoded.userId },
          { $set: { name: routineData.name } },
          { new: true }
        )
          .populate({ path: "days", populate: { path: "exercises", populate: "videos" } })
          .lean();
        if (!routine) return res.status(404).json({ message: "Rutina no encontrada" });
        //days
        const { days } = routineData as { days: IDay[] };
        days.forEach(async (day : IDay) => {
          const newDay = await Day.findByIdAndUpdate(day._id, { 
            dayName: day.dayName,
            musclesWorked: day.musclesWorked,
            warmupOptions: day.warmupOptions,
            explanation: day.explanation
          }, { new: true })
          .populate("exercises")
          .lean();
          //si no encontramos el dia, creamos uno nuevo
          if (!newDay){
            const exerciseIdsForDay: Types.ObjectId[] = [];
            day.exercises.forEach(async (exercise) => {
              const createExercise = new Exercise({ ...exercise, videos: [] });
              await createExercise.save();
              exerciseIdsForDay.push(exercise._id);
            });
            const createDay = new Day({ ...day, exercises: exerciseIdsForDay });
            await createDay.save();
          };

          //exercises
          const { exercises } = day as { exercises : IExercise[]};
          exercises.forEach(async (exercise:IExercise) => {
            const newExercise = await Exercise.findByIdAndUpdate(exercise._id, {
              name: exercise.name,
              muscleGroup: exercise.muscleGroup,
              sets: exercise.sets,
              reps: exercise.reps,
              rest: exercise.rest,
              tips: exercise.tips,
              notes: exercise.notes,
            }, { new: true, runValidators: true })
            .populate("videos")
            .lean();
            //si no encuentra ejercicio despues lo vamos a crear
            if (!newExercise) return res.status(404).json({ message: "Ejercicio no encontrado" });
          })
        });
        const serializedRoutine = {
          _id: routine._id.toString(),
          userId: routine.userId.toString(),
          name: routine.name,
          days: routine.days.map((d: Partial<IDay>) => ({
            _id: d._id?.toString(),
            dayName: d.dayName,
            musclesWorked: d.musclesWorked,
            warmupOptions: d.warmupOptions,
            explanation: d.explanation,
            exercises: (d.exercises ?? []).map((e: Partial<IExercise>) => ({
              _id: e._id?.toString(),
              name: e.name,
              muscleGroup: e.muscleGroup,
              sets: e.sets,
              reps: e.reps,
              repsUnit: e.repsUnit,
              weightUnit: e.weightUnit,
              weight: e.weight,
              rest: e.rest,
              tips: e.tips,
              completed: e.completed,
              videos: (e.videos ?? []).map((v: Partial<IVideo>) => ({
                _id: v._id?.toString(),
                url: v.url,
                isCurrent: v.isCurrent,
              })),
              notes: e.notes,
            })),
          })),
          createdAt: routine.createdAt.toISOString(),
          updatedAt: routine.updatedAt.toISOString(),
        };
        res.status(200).json(serializedRoutine);
      } catch (error) {
        res.status(500).json({ message: "Error al actualizar rutina", error });
      }
      break;

    case "DELETE":
      try {
        const routine = await Routine.findOneAndDelete({ _id: routineId, userId: decoded.userId });
        if (!routine) return res.status(404).json({ message: "Rutina no encontrada" });

        // Eliminar días, ejercicios y videos asociados
        for (const dayId of routine.days) {
          const day = await Day.findByIdAndDelete(dayId);
          if (day) {
            for (const exerciseId of day.exercises) {
              const exercise = await Exercise.findByIdAndDelete(exerciseId);
              if (exercise) {
                await Video.deleteMany({ _id: { $in: exercise.videos } });
              }
            }
          }
        }
        res.status(204).end();
      } catch (error) {
        res.status(500).json({ message: "Error al eliminar rutina", error });
      }
      break;

    default:
      res.status(405).json({ message: "Método no permitido" });
      break;
  }
}