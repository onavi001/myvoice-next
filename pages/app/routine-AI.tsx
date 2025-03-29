import React, { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../store";
import { createDay, createRoutine, generateRoutine, ThunkError } from "../../store/routineSlice";
import { IRoutine, RoutineData } from "../../models/Routine";
import { useRouter } from "next/router";
import Head from "next/head";
import Button from "../../components/Button";
import Input from "../../components/Input";
import Card from "../../components/Card";
import Toast from "../../components/Toast";
import {FuturisticLoader} from "../../components/Loader"; // Asegúrate de importar SmallLoader
import { IExercise } from "../../models/Exercise";
import { IDay } from "../../models/Day";
import { Types } from "mongoose";

export default function RoutineAIPage() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();
  const { routines, error, loading } = useSelector((state: RootState) => state.routine);
  const [currentRoutine, setCurrentRoutine] = useState<RoutineData | null>(null);
  const [initialFlag, setInitialFlag] = useState<boolean>(true);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [generatingRoutine, setGeneratingRoutine] = useState(false); // Loader para generar rutina
  const [savingRoutine, setSavingRoutine] = useState(false); // Loader para guardar rutina

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

  const handleGenerate = async () => {
    setGeneratingRoutine(true);
    setInitialFlag(false);
    try {
      const result = await dispatch(generateRoutine(formData)).unwrap();
      if (!result) {
        setToastMessage("Error al generar la rutina");
      }
    } catch (err) {
      const error = err as ThunkError;
      if (error.message === "Unauthorized" && error.status === 401) {
        router.push("/login");
      } else {
        setToastMessage("Error al generar la rutina");
        console.error("Error al generar rutina:", error.message);
      }
    } finally {
      setGeneratingRoutine(false);
    }
  };
  const getDefaultExercise = (): Partial<IExercise> => ({
    name: "Ejercicio sin nombre",
    sets: 1,
    reps: 1,
    weight: "0",
    weightUnit: "kg",
    repsUnit: "count",
    rest: "",
    tips: [],
    muscleGroup: [],
    completed: false,
    videos: []
  });
  const validateAndAdjustDay = (day: RoutineData["days"][number], routineId: Types.ObjectId):
  {routineId: Types.ObjectId; dayData: Partial<IDay>} => {
    // Validar y ajustar dayName
    const dayName = day.dayName && day.dayName.trim() !== "" ? day.dayName : "Día sin nombre";
  
    // Validar y ajustar explanation
    const explanation = day.explanation && day.explanation.trim() !== "" ? day.explanation : "";
  
    // Validar y ajustar warmupOptions
    const warmupOptions = Array.isArray(day.warmupOptions) && day.warmupOptions.length > 0 ? day.warmupOptions : [];
  
    // Validar y ajustar musclesWorked
    const musclesWorked = Array.isArray(day.musclesWorked) && day.musclesWorked.length > 0 ? day.musclesWorked : [];
  
    // Validar y ajustar ejercicios
    const exercises = Array.isArray(day.exercises) && day.exercises.length > 0 ? day.exercises : [getDefaultExercise()];
    const adjustedExercises = exercises.map((ex): Partial<IExercise> => ({
      name: ex.name && ex.name.trim() !== "" ? ex.name : "Ejercicio sin nombre",
      sets: typeof ex.sets === "number" && ex.sets > 0 ? ex.sets : 1,
      reps: typeof ex.reps === "number" && ex.reps > 0 ? ex.reps : 1,
      weight: typeof ex.weight === "number" && ex.weight >= 0 ? (ex.weight as number).toString() : "0",
      weightUnit: ex.weightUnit && ["kg", "lbs"].includes(ex.weightUnit) ? ex.weightUnit : "kg",
      repsUnit: "count",
      rest: ex.rest && ex.rest.trim() !== "" ? ex.rest : "",
      tips: Array.isArray(ex.tips) && ex.tips.every((tip) => typeof tip === "string" && tip.trim() !== "") ? ex.tips : [],
      muscleGroup: Array.isArray(ex.muscleGroup) && ex.muscleGroup.every((mg) => typeof mg === "string" && mg.trim() !== "") ? ex.muscleGroup : [],
      completed: false,
      videos: []
    }));
  
    return {
      routineId,
      dayData: {
        dayName,
        explanation,
        warmupOptions,
        musclesWorked,
        exercises: adjustedExercises as IExercise[],
      },
    };
  };
  const handleSaveRoutine = async () => {
    if (!currentRoutine) return;

    setSavingRoutine(true);
    try {
      const routineResult = await dispatch(
        createRoutine({ name: currentRoutine.name, days: [] } as unknown as IRoutine)
      ).unwrap();
      const routineId = routineResult._id;

      for (const day of currentRoutine.days) {
        const adjustedDay = validateAndAdjustDay(day, routineId);
        await dispatch(createDay(adjustedDay)).unwrap();
      }
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
      setTimeout(() => router.push("/app/routine"), 1000);
    } catch (err) {
      const error = err as ThunkError;
      if (error.message === "Unauthorized" && error.status === 401) {
        router.push("/login");
      } else {
        setToastMessage("Error al generar la rutina");
        console.error("Error al generar rutina:", error.message);
      }
    } finally {
      setSavingRoutine(false);
    }
  };

  const handleCloseToast = () => setToastMessage(null);
  if (loading) {
    return <FuturisticLoader />;
    
  }
  return (
    <div className="min-h-screen bg-[#1A1A1A] text-white p-4">
      <Head>
        <link rel="icon" href="/favicon.ico" />
        <title>Generar Rutina - Tu Aplicación</title>
      </Head>

      {!currentRoutine || error ? (
        <>
          <h1 className="text-lg font-bold text-[#34C759] mb-4">Generar Rutina</h1>
          <Card className="max-w-md mx-auto space-y-4 bg-[#252525] border-2 border-[#4A4A4A] p-4 rounded-md">
            
            <div className="flex items-center gap-4">
              <label className="w-16 text-[#D1D1D1] text-xs font-medium">Nombre:</label>
              <Input
                name="name"
                type="text"
                value={formData.name}
                onChange={(e) => handleChange("name", e.target.value)}
                placeholder="Nombre de la rutina"
                className="flex-1 bg-[#2D2D2D] border border-[#4A4A4A] text-white p-2 rounded-md text-xs focus:ring-1 focus:ring-[#34C759] focus:border-transparent"
              />
            </div>
            <div className="flex items-center gap-4">
              <label className="w-16 text-[#D1D1D1] text-xs font-medium">Nivel:</label>
              <select
                value={formData.level}
                onChange={(e) => handleChange("level", e.target.value)}
                className="flex-1 bg-[#2D2D2D] border border-[#4A4A4A] text-white p-2 rounded-md text-xs focus:ring-1 focus:ring-[#34C759] focus:border-transparent"
              >
                <option value="principiante">Principiante</option>
                <option value="intermedio">Intermedio</option>
                <option value="avanzado">Avanzado</option>
              </select>
            </div>
            <div className="flex items-center gap-4">
              <label className="w-16 text-[#D1D1D1] text-xs font-medium">Objetivo:</label>
              <select
                value={formData.goal}
                onChange={(e) => handleChange("goal", e.target.value)}
                className="flex-1 bg-[#2D2D2D] border border-[#4A4A4A] text-white p-2 rounded-md text-xs focus:ring-1 focus:ring-[#34C759] focus:border-transparent"
              >
                <option value="fuerza">Fuerza</option>
                <option value="hipertrofia">Hipertrofia</option>
                <option value="resistencia">Resistencia</option>
              </select>
            </div>
            <div className="flex items-center gap-4">
              <label className="w-16 text-[#D1D1D1] text-xs font-medium">Días (1-7):</label>
              <Input
                name="days"
                type="number"
                value={formData.days}
                onChange={(e) => handleChange("days", Number(e.target.value))}
                placeholder="Días"
                className="flex-1 bg-[#2D2D2D] border border-[#4A4A4A] text-white p-2 rounded-md text-xs focus:ring-1 focus:ring-[#34C759] focus:border-transparent"
                required
              />
            </div>
            <div className="flex items-center gap-4">
              <label className="w-16 text-[#D1D1D1] text-xs font-medium">Equipo:</label>
              <select
                value={formData.equipment}
                onChange={(e) => handleChange("equipment", e.target.value)}
                className="flex-1 bg-[#2D2D2D] border border-[#4A4A4A] text-white p-2 rounded-md text-xs focus:ring-1 focus:ring-[#34C759] focus:border-transparent"
              >
                <option value="gym">Gimnasio</option>
                <option value="casa">Casa</option>
                <option value="pesas">Pesas</option>
              </select>
            </div>
            <div>
              <label className="text-[#D1D1D1] text-xs font-medium">Notas:</label>
              <textarea
                value={formData.notes}
                onChange={(e) => handleChange("notes", e.target.value)}
                placeholder="Notas"
                className="w-full bg-[#2D2D2D] border border-[#4A4A4A] text-white p-2 rounded-md text-xs h-20 resize-none focus:ring-1 focus:ring-[#34C759] focus:border-transparent"
              />
            </div>
            <Button
              onClick={handleGenerate}
              disabled={generatingRoutine}
              className="w-full bg-[#34C759] text-black p-2 rounded-md disabled:bg-[#34C759] disabled:opacity-50 text-xs font-semibold hover:bg-[#2ca44e] border border-[#34C759] shadow-md"
            >
              {generatingRoutine ? <><FuturisticLoader />Generar Rutina</>: "Generar Rutina"}
            </Button>
          </Card>
        </>
      ) : (
        <div className="mt-8 max-w-md mx-auto">
          <div className="flex space-x-2">
            <Button
              onClick={handleSaveRoutine}
              disabled={savingRoutine}
              className="w-full bg-[#34C759] text-black p-2 rounded-md disabled:bg-[#34C759] disabled:opacity-50 mt-4 text-xs font-semibold hover:bg-[#2ca44e] border border-[#34C759] shadow-md"
            >
              {savingRoutine ? <><FuturisticLoader />Guardar Rutina</> : "Guardar Rutina"}
            </Button>
            <Button
              type="button"
              onClick={() => {setCurrentRoutine(null); setInitialFlag(true);}}
              className="mt-4 w-1/2 bg-[#EF5350] text-white hover:bg-[#D32F2F] rounded-md py-1 px-2 text-xs font-semibold border border-[#D32F2F] shadow-md disabled:bg-[#D32F2F] disabled:opacity-50"
            >
              Generar nueva rutina
            </Button>
          </div>
          <h2 className="text-xl font-semibold text-[#34C759]">{currentRoutine.name}</h2>
          {currentRoutine.days.map((day) => (
            <Card
              key={day._id.toString()}
              className="mt-4 bg-[#252525] border-2 border-[#4A4A4A] p-4 rounded-md"
            >
              <h3 className="text-lg font-bold">{day.dayName}</h3>
              <p className="text-[#D1D1D1] text-xs">{day.explanation}</p>
              <ul className="mt-2 space-y-2">
                {day.exercises.map((ex) => (
                  <li key={ex._id.toString()} className="text-sm text-[#B0B0B0] flex items-center justify-between">
                    <span>
                      {ex.name} - {ex.sets}x{ex.reps} ({ex.weight} {ex.weightUnit}) - Descanso: {ex.rest}
                    </span>
                  </li>
                ))}
              </ul>
            </Card>
          ))}
          <div className="flex space-x-2">
            <Button
              onClick={handleSaveRoutine}
              disabled={savingRoutine}
              className="w-full bg-[#34C759] text-black p-2 rounded-md disabled:bg-[#34C759] disabled:opacity-50 mt-4 text-xs font-semibold hover:bg-[#2ca44e] border border-[#34C759] shadow-md"
            >
              {savingRoutine ? <><FuturisticLoader />Guardar Rutina</> : "Guardar Rutina"}
            </Button>
            <Button
              type="button"
              onClick={() => {setCurrentRoutine(null); setInitialFlag(true);}}
              className="mt-4 w-1/2 bg-[#EF5350] text-white hover:bg-[#D32F2F] rounded-md py-1 px-2 text-xs font-semibold border border-[#D32F2F] shadow-md disabled:bg-[#D32F2F] disabled:opacity-50"
            >
              Generar nueva rutina
            </Button>
          </div>
        </div>
      )}

      {error && <p className="text-red-500 mt-4 text-center text-xs">{error}</p>}
      {toastMessage && <Toast message={toastMessage} onClose={handleCloseToast} />}
    </div>
  );
}