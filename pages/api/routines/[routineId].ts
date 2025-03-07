import { NextApiRequest, NextApiResponse } from "next";
import {dbConnect} from "../../../lib/mongodb";
import Routine from "../../../models/routines";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const { routineId } = req.query;
  const { method } = req;

  await dbConnect();

  switch (method) {
    case "PUT":
      try {
        const updatedRoutine = await Routine.findByIdAndUpdate(routineId, req.body, { new: true, runValidators: true });
        if (!updatedRoutine) return res.status(404).json({ message: "Routine not found" });
        res.status(200).json(updatedRoutine);
      } catch (error) {
        res.status(500).json({ message: "Error updating routine", error });
      }
      break;
    case "DELETE":
      try {
        const deletedRoutine = await Routine.findByIdAndDelete(routineId);
        if (!deletedRoutine) return res.status(404).json({ message: "Routine not found" });
        res.status(200).json({ message: "Routine deleted" });
      } catch (error) {
        res.status(500).json({ message: "Error deleting routine", error });
      }
      break;
    default:
      res.setHeader("Allow", ["PUT", "DELETE"]);
      res.status(405).end(`Method ${method} Not Allowed`);
  }
}