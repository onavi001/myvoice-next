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
            - Objetivo: ${goal} (fuerza: levantamientos pesados; hipertrofia: volumen; resistencia: alta repetición)
            - Nivel: ${level} (principiante: básico; intermedio: mixto; avanzado: complejo)
            - Días: ${days} (exactamente este número)
            - Equipo: ${equipment} (gym: máquinas y pesas; casa: peso corporal; pesas: pesas libres)
            ${notes ? `- Notas (obligatorio seguir): "${notes}"` : ""}
            **Instrucciones:**
            - Genera una rutina con ${days} días, cada uno con 6 ejercicios únicos y específicos (no repitas entre días).
            - Por ejercicio: "name" (ej. "Press de banca con barra"), "muscleGroup" (grupo muscular principal), "sets" (3-5), "reps" (6-15 según objetivo), "weight" (valor numérico o rango como "10-15", sin unidad), "weightUnit" ("kg" por defecto), "rest" (ej. "60s"), "tips" (array con 2 consejos), "completed" (false), "videos" (array vacío), "notes" (string vacío o basado en las notas si aplica).
            - Por día: "dayName" (descriptivo, ej. "Pecho y Tríceps"), "musclesWorked" (array de 3 músculos), "warmupOptions" (array de 3 calentamientos relevantes), "explanation" (breve, 15-20 palabras).
            - Incluye "_id" como string ficticio para cada nivel (ej. "routine1", "day1", "exercise1"), "userId" como "user123", "createdAt" y "updatedAt" como ISO strings actuales.
            **Formato JSON:**
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
                    "muscleGroup": "...",
                    "sets": 4,
                    "reps": 8,
                    "repsUnit": "count",
                    "weight": "10-15",
                    "weightUnit": "kg",
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

        // Llamada a la API de Groq
        const response = await fetch("https://api.groq.com/openai/v1/chat/completions", {
            method: "POST",
            headers: {
            "Authorization": `Bearer ${process.env.GROQ_API_KEY}`,
            "Content-Type": "application/json",
            },
            body: JSON.stringify({
            model: "mixtral-8x7b-32768",
            messages: [
                { role: "system", content: "Eres un experto en fitness que genera rutinas precisas en JSON." },
                { role: "user", content: prompt },
            ],
            max_tokens: 9500,
            temperature: 0.1,
            }),
        });

        if (!response.ok) throw new Error(`Error ${response.status}: ${response.statusText}`);
        const data = await response.json();
        const routineData: RoutineData = JSON.parse(data.choices[0]?.message.content);
        /*
        // Guardar en MongoDB reemplazando IDs ficticios con IDs reales
        const daysData: IDay[] = [];

        for (const day of routineData.days) {
            const exercisesForDay: Partial<IExercise>[] = day.exercises.map((ex) => ({
                ...ex,
                _id: new mongoose.Types.ObjectId(),
                videos: ex.videos.map(() => new mongoose.Types.ObjectId()),
            }));

            const dayExercises = await ExerciseModel.insertMany(exercisesForDay);
            const exerciseIds = dayExercises.map((ex) => ex._id);

            const dayDoc: IDay = {
                _id: new mongoose.Types.ObjectId(),
                dayName: day.dayName,
                musclesWorked: day.musclesWorked,
                warmupOptions: day.warmupOptions,
                explanation: day.explanation,
                exercises: exerciseIds,
            };

            const savedDay = await new DayModel(dayDoc).save();
            daysData.push(savedDay);
        }

        const routine: IRoutine = {
            //_id: new mongoose.Types.ObjectId(),
            userId: new mongoose.Types.ObjectId(),
            name: routineData.name,
            days: daysData.map((day) => day._id),
            createdAt: new Date(),
            updatedAt: new Date(),
        };

        const savedRoutine = await new RoutineModel(routine).save();

        // Construir el RoutineData final con IDs reales
        const finalRoutineData: RoutineData = {
            _id: savedRoutine._id.toString(),
            userId: savedRoutine.userId.toString(),
            name: savedRoutine.name,
            days: await Promise.all(
            daysData.map(async (day) => ({
                _id: day._id.toString(),
                dayName: day.dayName,
                musclesWorked: day.musclesWorked,
                warmupOptions: day.warmupOptions,
                explanation: day.explanation,
                exercises: await Promise.all(
                (await ExerciseModel.find({ _id: { $in: day.exercises } })).map((ex) => ({
                    _id: ex._id.toString(),
                    name: ex.name,
                    muscleGroup: ex.muscleGroup,
                    sets: ex.sets,
                    reps: ex.reps,
                    repsUnit: ex.repsUnit,
                    weight: ex.weight,
                    weightUnit: ex.weightUnit,
                    rest: ex.rest,
                    tips: ex.tips,
                    completed: ex.completed,
                    videos: ex.videos.map((v) => ({ _id: v.toString(), url: "", isCurrent: false })),
                    notes: ex.notes || "",
                }))
                ),
            }))
            ),
            createdAt: savedRoutine.createdAt.toISOString(),
            updatedAt: savedRoutine.updatedAt.toISOString(),
        };
        */
        res.status(200).json(routineData);
    } catch (error) {
        console.error("Error al generar rutina:", error);
        res.status(500).json({ error: "Error interno del servidor" });
    }
}