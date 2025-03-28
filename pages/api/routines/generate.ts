import type { NextApiRequest, NextApiResponse } from "next";
import { RoutineData } from "../../../models/Routine";
import { dbConnect } from "../../../lib/mongodb";

interface RoutineInput {
  level: "principiante" | "intermedio" | "avanzado";
  goal: "fuerza" | "hipertrofia" | "resistencia";
  days: number;
  equipment: "gym" | "casa" | "pesas";
  name?: string;
  notes?: string;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
    await dbConnect();
    if (req.method !== "POST") {
        return res.status(405).json({ error: "Método no permitido" });
    }
    try {
        const { level, goal, days, equipment, name = "Rutina sin nombre", notes = "" } = req.body as RoutineInput;

        if (!level || !goal || !days || !equipment) {
            return res.status(400).json({ error: "Faltan parámetros requeridos" });
        }
        const token = req.cookies.token || req.headers.authorization?.split(" ")[1];
        if (!token) return res.status(401).json({ message: "No autenticado" });
        
        // Prompt actualizado
        const prompt = `
            Genera una rutina de entrenamiento personalizada y detallada llamada "${name}" para un usuario con:
            - Objetivo: ${goal} (fuerza: levantamientos pesados o equivalentes; hipertrofia: volumen; resistencia: alta repetición)
            - Nivel: ${level} (principiante: básico; intermedio: mixto; avanzado: complejo)
            - Días: ${days} (exactamente este número)
            - Equipo: ${equipment} (gym: máquinas y pesas; casa: solo peso corporal o equipo mínimo como bandas/mantecas ligeras; pesas: pesas libres)
            ${notes ? `- Notas (obligatorio seguir): "${notes}"` : ""}
            **Instrucciones:**
            - Genera una rutina con ${days} días, cada uno con 6 ejercicios únicos y específicos (no repitas entre días).
            - Para "casa": usa solo ejercicios de peso corporal (ej. flexiones, sentadillas) o con equipo mínimo (ej. bandas, mancuernas ligeras); evita máquinas o pesas pesadas.
            - Por ejercicio: "name" (ej. "Flexiones"), "muscleGroup" (grupo muscular principal), "sets" (3-5), "reps" (6-15 según objetivo), "weight" ("0" si es peso corporal, rango como "5-10" si aplica), "weightUnit" ("kg" o "lb"), "rest" (ej. "60s"), "tips" (array con 2 consejos), "completed" (false), "videos" (array vacío), "notes" (string vacío o basado en las notas si aplica).
            - Por día: "dayName" (descriptivo, ej. "Cuerpo completo en casa"), "musclesWorked" (array de 3 músculos), "warmupOptions" (array de 3 calentamientos sin equipo, ej. "Saltos"), "explanation" (breve, 15-20 palabras).
            - Incluye "_id" como string ficticio para cada nivel (ej. "routine1", "day1", "exercise1"), "userId" como "user123", "createdAt" y "updatedAt" como ISO strings actuales.
            **Formato JSON estricto:**
            - Devuelve SOLO el objeto JSON, sin texto adicional, sin bloques de código (como ${"```json"}), sin comentarios ni explicaciones fuera del JSON.
            {
            "_id": "routine1",
            "userId": "user123",
            "name": "${name}",
            "days": [
                {
                "_id": "day1",
                "dayName": "...",
                "musclesWorked": ["...", "...", "..."],
                "warmupOptions": ["...", "...", "..."],
                "explanation": "...",
                "exercises": [
                    {
                    "_id": "exercise1",
                    "name": "...",
                    "muscleGroup": ["...", "...", "..."],
                    "sets": 4,
                    "reps": 8,
                    "repsUnit": "count",
                    "weight": "10",
                    "rest": "...",
                    "tips": ["...", "..."],
                    "completed": false,
                    "videos": [],
                    "notes": ""
                    }
                ]
                }
            ],
            "createdAt": "2025-03-13T12:00:00Z",
            "updatedAt": "2025-03-13T12:00:00Z"
            }
            Devuelve solo el objeto JSON, sin texto adicional fuera del JSON.
        `;
        console.log(prompt)
        // Llamada a la API de Groq
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
            "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
            "Content-Type": "application/json",
            },
            body: JSON.stringify({
            model: "llama-3.3-70b-versatile",
            messages: [
                { role: "system", content: "Eres un experto en fitness que genera rutinas precisas en JSON." },
                { role: "user", content: prompt },
            ],
            max_tokens: 9500,
            temperature: 0.4,
            }),
        });
        if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
        const data = await response.json();
        let content = data.choices[0]?.message.content.trim();
        if (content.startsWith("```json")) content = content.slice(7, -3).trim();
        const routineData: RoutineData = JSON.parse(content);
        res.status(200).json(routineData);
    } catch (error) {
        console.log(error)
        console.error("Error al generar rutina:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
}