import type { NextApiRequest, NextApiResponse } from "next";
import {dbConnect} from "../../lib/mongodb";
import Progress from "../../models/progress";
import jwt from "jsonwebtoken";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
  if (!token) {
    return res.status(401).json({ message: "Unauthorized: No token provided" });
  }

  try {
    // Verificar el token JWT
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "my-super-secret-key") as { userId: string };

    // Conectar a MongoDB
    await dbConnect();

    if (req.method === "GET") {
      // Obtener todas las entradas de progreso del usuario
      const progress = await Progress.find({ userId: decoded.userId }).lean();
      return res.status(200).json(progress);
    } else if (req.method === "POST") {
      // Crear una nueva entrada de progreso
      const progressData = {
        ...req.body,
        userId: decoded.userId,
        date: new Date(), // Agregar fecha automáticamente
      };
      const newProgress = await Progress.create(progressData);
      return res.status(201).json(newProgress);
    } else {
      return res.status(405).json({ message: "Method not allowed" });
    }
  } catch (error) {
    console.error("API Error in /api/progress:", error);
    if (error instanceof jwt.JsonWebTokenError) {
      return res.status(401).json({ message: "Unauthorized: Invalid or expired token" });
    }
    return res.status(500).json({ message: "Server error", error: (error as Error).message });
  }
}