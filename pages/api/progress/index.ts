// pages/api/progress/index.ts
import { NextApiRequest, NextApiResponse } from "next";
import {dbConnect} from "../../../lib/mongodb";
import Progress, { IProgress } from "../../../models/progress";
import jwt from "jsonwebtoken";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  await dbConnect();

  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "No autenticado" });
  }

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
        const progress = await Progress.find({ userId }).sort({ date: -1 });
        res.status(200).json(progress);
      } catch (error) {
        res.status(500).json({ message: "Error al obtener el progreso", error });
      }
      break;

    case "POST":
      try {
        const progressData: IProgress = { ...req.body, userId };
        const newProgress = new Progress(progressData);
        await newProgress.save();
        res.status(201).json(newProgress);
      } catch (error) {
        res.status(500).json({ message: "Error al agregar el progreso", error });
      }
      break;

    case "DELETE":
      try {
        await Progress.deleteMany({ userId });
        res.status(200).json({ message: "Progreso limpiado correctamente" });
      } catch (error) {
        res.status(500).json({ message: "Error al limpiar el progreso", error });
      }
      break;

    default:
      res.status(405).json({ message: "Método no permitido" });
      break;
  }
}