import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../store";
import { createDay, createRoutine, generateRoutine } from "../store/routineSlice";
import { RoutineData } from "../models/Routine";
import { useRouter } from "next/router";
import Head from "next/head";
import Button from "../components/Button";
import Input from "../components/Input";
import Card from "../components/Card";
import Toast from "../components/Toast";
import { IExercise } from "../models/Exercise";

export default function RoutineAIPage() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { routines, loading, error } = useSelector((state: RootState) => state.routine);
  const [currentRoutine, setCurrentRoutine] = useState<RoutineData | null>(null);
  const [initialFlag, setInitialFlag] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);

  const [formData, setFormData] = useState({
    level: "intermedio" as const,
    goal: "hipertrofia" as const,
    days: 3,
    equipment: "gym" as const,
    name: "Rutina de Volumen",
    notes: "Enfocarse en movimientos compuestos",
  });

  useEffect(() => {
    setCurrentRoutine(null);
  }, []);

  useEffect(() => {
    if (!initialFlag && routines.length > 0) {
      setCurrentRoutine(routines[routines.length - 1]);
    }
  }, [routines, initialFlag]);

  const handleChange = (field: keyof typeof formData, value: string | number) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleGenerate = () => {
    setInitialFlag(false);
    dispatch(generateRoutine(formData)).then((result) => {
      if (result.meta.requestStatus === "rejected") {
        setToastMessage("Error al generar la rutina");
      }
    });
  };

  const handleSaveRoutine = async () => {
    if (!currentRoutine) return;
    console.log(currentRoutine)
    
    try {
      const routineResult = await dispatch(
        createRoutine({ name: currentRoutine.name, days: [] })
      ).unwrap();
      const routineId = routineResult._id;

      for (const day of currentRoutine.days) {
        await dispatch(
          createDay({
            routineId,
            dayData: {
              dayName: day.dayName,
              explanation: day.explanation,
              warmupOptions: day.warmupOptions,
              musclesWorked: day.musclesWorked,
              exercises: day.exercises.map((ex) => ({
                tips: ex.tips,
                muscleGroup: ex.muscleGroup,
                rest: ex.rest,
                name: ex.name,
                sets: ex.sets,
                reps: ex.reps,
                weight: ex.weight,
                weightUnit: ex.weightUnit,
                repsUnit: ex.repsUnit,
              })) as IExercise[],
            },
          })
        ).unwrap();
      }

      setToastMessage("Rutina guardada correctamente");
      setCurrentRoutine(null);
      setTimeout(() => router.push("/routine"), 1000);
    } catch (err) {
      console.error("Error al guardar rutina:", err);
      setToastMessage("Error al guardar la rutina");
    }
  };

  const handleCloseToast = () => setToastMessage(null);

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-white p-4">
      <Head>
        <link rel="icon" href="/favicon.ico" />
        <title>Generar Rutina - Tu Aplicación</title>
      </Head>

      {!currentRoutine ? (
        <>
          <h1 className="text-lg font-bold text-[#34C759] mb-4">Generar Rutina</h1>
          <Card className="max-w-md mx-auto space-y-4 bg-[#252525] border-2 border-[#4A4A4A] p-4 rounded-md">
            <Input
                name="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Nombre de la rutina"
                className="w-full bg-[#2D2D2D] border border-[#4A4A4A] text-white p-2 rounded-md text-xs"
            />
            <select
              value={formData.level}
              onChange={(e) => handleChange("level", e.target.value)}
              className="w-full bg-[#2D2D2D] border border-[#4A4A4A] text-white p-2 rounded-md text-xs"
            >
              <option value="principiante">Principiante</option>
              <option value="intermedio">Intermedio</option>
              <option value="avanzado">Avanzado</option>
            </select>
            <select
              value={formData.goal}
              onChange={(e) => handleChange("goal", e.target.value)}
              className="w-full bg-[#2D2D2D] border border-[#4A4A4A] text-white p-2 rounded-md text-xs"
            >
              <option value="fuerza">Fuerza</option>
              <option value="hipertrofia">Hipertrofia</option>
              <option value="resistencia">Resistencia</option>
            </select>
            <Input
                name="days"
              type="number"
              value={formData.days}
              onChange={(e) => handleChange("days", Number(e.target.value))}
              placeholder="Días"
              className="w-full bg-[#2D2D2D] border border-[#4A4A4A] text-white p-2 rounded-md text-xs"
            />
            <select
              value={formData.equipment}
              onChange={(e) => handleChange("equipment", e.target.value)}
              className="w-full bg-[#2D2D2D] border border-[#4A4A4A] text-white p-2 rounded-md text-xs"
            >
              <option value="gym">Gimnasio</option>
              <option value="casa">Casa</option>
              <option value="pesas">Pesas</option>
            </select>
            <textarea
              value={formData.notes}
              onChange={(e) => handleChange("notes", e.target.value)}
              placeholder="Notas"
              className="w-full bg-[#2D2D2D] border border-[#4A4A4A] text-white p-2 rounded-md text-xs h-20 resize-none"
            />
            <Button
              onClick={handleGenerate}
              disabled={loading}
              className="w-full bg-[#34C759] text-black p-2 rounded-md disabled:opacity-50 text-xs font-semibold"
            >
              {loading ? "Generando..." : "Generar Rutina"}
            </Button>
          </Card>
        </>
      ) : (
        <div className="mt-8 max-w-md mx-auto">
          <h2 className="text-xl font-semibold text-[#34C759]">{currentRoutine.name}</h2>
          {currentRoutine.days.map((day) => (
            <Card
              key={day._id}
              className="mt-4 bg-[#252525] border-2 border-[#4A4A4A] p-4 rounded-md"
            >
              <h3 className="text-lg font-bold">{day.dayName}</h3>
              <p className="text-[#D1D1D1] text-xs">{day.explanation}</p>
              <ul className="mt-2 space-y-2">
                {day.exercises.map((ex) => (
                  <li key={ex._id} className="text-sm text-[#B0B0B0] flex items-center justify-between">
                    <span>
                      {ex.name} - {ex.sets}x{ex.reps} ({ex.weight} {ex.weightUnit}) - Descanso: {ex.rest}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
          <Button
            onClick={handleSaveRoutine}
            disabled={loading}
            className="w-full bg-[#34C759] text-black p-2 rounded-md disabled:opacity-50 mt-4 text-xs font-semibold"
          >
            {loading ? "Guardando..." : "Guardar Rutina"}
          </Button>
        </div>
      )}

      {error && <p className="text-red-500 mt-4 text-center text-xs">{error}</p>}
      {toastMessage && <Toast message={toastMessage} onClose={handleCloseToast} />}
    </div>
  );
}