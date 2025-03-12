import { NextApiRequest, NextApiResponse } from "next";
import {dbConnect} from "../../../lib/mongodb";
import Routine from "../../../models/Routine";
import Day from "../../../models/Day";
import Exercise from "../../../models/Exercise";
import Video from "../../../models/Video";
import jwt from "jsonwebtoken";

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

  const userId = decoded.userId;

  switch (req.method) {
    case "GET":
      try {
        const routines = await Routine.find({ userId })
          .populate({
            path: "days",
            populate: {
              path: "exercises",
              populate: { path: "videos" },
            },
          })
          .lean();
        const serializedRoutines = routines.map((r) => ({
          _id: r._id.toString(),
          userId: r.userId.toString(),
          name: r.name,
          days: r.days.map((d: any) => ({
            _id: d._id.toString(),
            dayName: d.dayName,
            musclesWorked: d.musclesWorked,
            warmupOptions: d.warmupOptions,
            explanation: d.explanation,
            exercises: d.exercises.map((e: any) => ({
              _id: e._id.toString(),
              name: e.name,
              muscleGroup: e.muscleGroup,
              sets: e.sets,
              reps: e.reps,
              weight: e.weight,
              rest: e.rest,
              tips: e.tips,
              completed: e.completed,
              videos: e.videos.map((v: any) => ({
                _id: v._id.toString(),
                url: v.url,
                isCurrent: v.isCurrent,
              })),
              notes: e.notes,
            })),
          })),
          createdAt: r.createdAt.toISOString(),
          updatedAt: r.updatedAt.toISOString(),
        }));
        res.status(200).json(serializedRoutines);
      } catch (error) {
        res.status(500).json({ message: "Error al obtener rutinas", error });
      }
      break;

    case "POST":
      try {
        const { name, days } = req.body;

        // Crear videos, ejercicios y días
        const videoIds = [];
        const exerciseIds = [];
        const dayIds = [];

        for (const dayData of days) {
          const exercises = dayData.exercises || [];
          const exerciseIdsForDay = [];

          for (const exData of exercises) {
            const videos = exData.videos || [];
            const videoIdsForExercise = [];

            for (const videoData of videos) {
              const video = new Video(videoData);
              await video.save();
              videoIds.push(video._id);
              videoIdsForExercise.push(video._id);
            }

            const exercise = new Exercise({ ...exData, videos: videoIdsForExercise });
            await exercise.save();
            exerciseIds.push(exercise._id);
            exerciseIdsForDay.push(exercise._id);
          }

          const day = new Day({ ...dayData, exercises: exerciseIdsForDay });
          await day.save();
          dayIds.push(day._id);
        }

        const routine = new Routine({ userId, name, days: dayIds });
        await routine.save();

        const populatedRoutine = await Routine.findById(routine._id)
          .populate({
            path: "days",
            populate: {
              path: "exercises",
              populate: { path: "videos" },
            },
          })
          .lean();

        if (!populatedRoutine) {
          return res.status(500).json({ message: "Error al crear rutina" });
        }

        const serializedRoutine = {
          _id: populatedRoutine._id.toString(),
          userId: populatedRoutine.userId.toString(),
          name: populatedRoutine.name,
          days: populatedRoutine.days.map((d: any) => ({
            _id: d._id.toString(),
            dayName: d.dayName,
            musclesWorked: d.musclesWorked,
            warmupOptions: d.warmupOptions,
            explanation: d.explanation,
            exercises: d.exercises.map((e: any) => ({
              _id: e._id.toString(),
              name: e.name,
              muscleGroup: e.muscleGroup,
              sets: e.sets,
              reps: e.reps,
              weight: e.weight,
              rest: e.rest,
              tips: e.tips,
              completed: e.completed,
              videos: e.videos.map((v: any) => ({
                _id: v._id.toString(),
                url: v.url,
                isCurrent: v.isCurrent,
              })),
              notes: e.notes,
            })),
          })),
          createdAt: populatedRoutine.createdAt.toISOString(),
          updatedAt: populatedRoutine.updatedAt.toISOString(),
        };

        res.status(201).json(serializedRoutine);
      } catch (error) {
        res.status(500).json({ message: "Error al crear rutina", error });
      }
      break;

    default:
      res.status(405).json({ message: "Método no permitido" });
      break;
  }
}