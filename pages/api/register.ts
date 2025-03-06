import type { NextApiRequest, NextApiResponse } from "next";
import { dbConnect } from "../../lib/mongodb";
import User from "../../models/users";
import bcrypt from "bcryptjs";

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  if (req.method !== "POST") return res.status(405).json({ message: "Method not allowed" });

  await dbConnect();
  const { username, email, password } = req.body;

  const hashedPassword = await bcrypt.hash(password, 10);
  const user = new User({ username, email, password: hashedPassword });

  try {
    await user.save();
    res.status(201).json({ message: "User created" });
  } catch (error) {
    res.status(400).json({ message: "Error creating user", error });
  }
}