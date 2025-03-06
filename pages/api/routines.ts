import type { NextApiRequest, NextApiResponse } from "next";
import {dbConnect} from "../../lib/mongodb";
import Routine from "../../models/routines";
import jwt from "jsonwebtoken";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
  if (!token) return res.status(401).json({ message: "Unauthorized" });

  try {
    await dbConnect();
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "my-super-secret-key") as { userId: string };

    if (req.method === "GET") {
      const routines = await Routine.find({ userId: decoded.userId }).lean();
      res.status(200).json(routines);
    } else if (req.method === "POST") {
      const routineData = { ...req.body, userId: decoded.userId };
      const newRoutine = await Routine.create(routineData);
      res.status(201).json(newRoutine);
    } else if (req.method === "PUT") {
      const { routineId, dayIndex, exerciseIndex, completed } = req.body;
      const updatePath = `days.${dayIndex}.exercises.${exerciseIndex}.completed`;
      const routine = await Routine.findByIdAndUpdate(
        routineId,
        { $set: { [updatePath]: completed } },
        { new: true }
      ).lean();
      res.status(200).json(routine);
    } else {
      res.status(405).json({ message: "Method not allowed" });
    }
  } catch (error) {
    console.error("API Error:", error);
    res.status(500).json({ message: "Server error", error });
  }
}