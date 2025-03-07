import { NextApiRequest, NextApiResponse } from "next";
import {dbConnect} from "../../../../lib/mongodb";
import Routine from "../../../../models/routines";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { routineId } = req.query;
  const { method } = req;

  await dbConnect();

  if (method === "PATCH") {
    try {
      const { dayIndex, exerciseIndex, videos } = req.body;
      const routine = await Routine.findById(routineId);
      if (!routine) return res.status(404).json({ message: "Routine not found" });

      routine.days[dayIndex].exercises[exerciseIndex].videos = videos;
      await routine.save();

      res.status(200).json(routine);
    } catch (error) {
      res.status(500).json({ message: "Error updating exercise videos", error });
    }
  } else {
    res.setHeader("Allow", ["PATCH"]);
    res.status(405).end(`Method ${method} Not Allowed`);
  }
}