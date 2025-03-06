import type { NextApiRequest, NextApiResponse } from "next";
import {dbConnect} from "../../lib/mongodb";
import Routine from "../../models/routines";
import jwt from "jsonwebtoken";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "my-super-secret-key") as { userId: string };
    await dbConnect();

    if (req.method === "GET") {
      const routines = await Routine.find({ userId: decoded.userId }).lean();
      return res.status(200).json(routines);
    } else if (req.method === "POST") {
      const routineData = {
        ...req.body,
        userId: decoded.userId,
        createdAt: new Date(),
        updatedAt: new Date(),
      };
      const newRoutine = await Routine.create(routineData);
      return res.status(201).json(newRoutine);
    } else if (req.method === "PUT") {
      const { routineId, dayIndex, exerciseIndex, completed } = req.body;
      const updatePath = `days.${dayIndex}.exercises.${exerciseIndex}.completed`;
      const routine = await Routine.findByIdAndUpdate(
        routineId,
        { $set: { [updatePath]: completed } },
        { new: true }
      ).lean();
      if (!routine) return res.status(404).json({ message: "Routine not found" });
      return res.status(200).json(routine);
    } else {
      return res.status(405).json({ message: "Method not allowed" });
    }
  } catch (error) {
    console.error("API Error in /api/routines:", error);
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: "Unauthorized: Invalid or expired token" });
    }
    return res.status(500).json({ message: "Server error", error: (error as Error).message });
  }
}