import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useRouter } from "next/router";
import { AppDispatch, RootState } from "../store";
import { createRoutine, createDay} from "../store/routineSlice";
import Button from "../components/Button";
import Input from "../components/Input";
import Card from "../components/Card";

interface DayFormData {
  dayName: string;
  exercises: { name: string; sets: number; reps: number }[];
  isOpen: boolean;
}

export default function RoutineFormPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { loading: userLoading } = useSelector((state: RootState) => state.user);
  const router = useRouter();

  const [routineName, setRoutineName] = useState("");
  const [days, setDays] = useState<DayFormData[]>([
    { dayName: "", exercises: [{ name: "", sets: 0, reps: 0 }], isOpen: true },
  ]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const handleAddDay = () => {
    setDays([...days, { dayName: "", exercises: [{ name: "", sets: 0, reps: 0 }], isOpen: true }]);
  };

  const handleAddExercise = (dayIndex: number) => {
    const updatedDays = [...days];
    updatedDays[dayIndex].exercises.push({ name: "", sets: 0, reps: 0 });
    setDays(updatedDays);
  };

  const handleDayChange = (dayIndex: number, field: string, value: string) => {
    const updatedDays = [...days];
    updatedDays[dayIndex] = { ...updatedDays[dayIndex], [field]: value };
    setDays(updatedDays);
  };

  const handleExerciseChange = (dayIndex: number, exerciseIndex: number, field: string, value: string | number) => {
    const updatedDays = [...days];
    updatedDays[dayIndex].exercises[exerciseIndex] = {
      ...updatedDays[dayIndex].exercises[exerciseIndex],
      [field]: typeof value === "number" ? value : value,
    };
    setDays(updatedDays);
  };

  const toggleDay = (dayIndex: number) => {
    const updatedDays = [...days];
    updatedDays[dayIndex].isOpen = !updatedDays[dayIndex].isOpen;
    setDays(updatedDays);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!routineName || days.some((day) => !day.dayName || day.exercises.some((ex) => !ex.name))) {
      setError("Todos los campos obligatorios deben estar completos");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      const routineResult = await dispatch(createRoutine({ name: routineName, days: [] })).unwrap();
      const routineId = routineResult._id;

      for (const day of days) {
        await dispatch(
          createDay({
            routineId,
            dayData: {
              dayName: day.dayName,
              exercises: day.exercises.map((ex) => ({ name: ex.name, sets: ex.sets, reps: ex.reps, weightUnit: "kg", repsUnit: "count" })),
            },
          })
        ).unwrap();
      }

      router.push("/routine");
    } catch (err) {
      setError("Error al crear la rutina");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (userLoading) return <div className="min-h-screen bg-[#1A1A1A] text-white flex items-center justify-center">Cargando...</div>;
  //if (!user) return router.push("/");

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-white flex flex-col">
      <div className="p-4 max-w-md mx-auto flex-1">
        <h1 className="text-lg font-bold mb-3 text-white">Crear Rutina</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[#D1D1D1] text-xs font-medium mb-1">Nombre</label>
            <Input
              name="routineName"
              value={routineName}
              onChange={(e) => setRoutineName(e.target.value)}
              placeholder="Rutina de Fuerza"
              className="w-full bg-[#2D2D2D] border border-[#4A4A4A] text-white placeholder-[#B0B0B0] rounded-md p-2 text-xs focus:ring-1 focus:ring-[#34C759] focus:border-transparent"
            />
          </div>

          {/* Días */}
          {days.map((day, dayIndex) => (
            <Card
              key={dayIndex}
              className="p-2 bg-[#252525] border-2 border-[#4A4A4A] rounded-md mb-2"
            >
              <div
                className="flex justify-between items-center cursor-pointer py-1 bg-[#2D2D2D] px-2 rounded-t-md"
                onClick={() => toggleDay(dayIndex)}
              >
                <h2 className="text-sm font-bold text-[#34C759]">
                  {day.dayName || `Día ${dayIndex + 1}`}
                </h2>
                <span className="text-[#D1D1D1] text-xs">{day.isOpen ? "▲" : "▼"}</span>
              </div>
              {day.isOpen && (
                <div className="mt-1 space-y-2">
                  <div>
                    <label className="block text-[#D1D1D1] text-xs font-medium mb-1">Día</label>
                    <Input
                      name="dayName"
                      value={day.dayName}
                      onChange={(e) => handleDayChange(dayIndex, "dayName", e.target.value)}
                      placeholder="Pecho y Tríceps"
                      className="bg-[#2D2D2D] border border-[#4A4A4A] text-white placeholder-[#B0B0B0] rounded-md p-2 text-xs w-full focus:ring-1 focus:ring-[#34C759] focus:border-transparent"
                    />
                  </div>
                  {day.exercises.map((exercise, exerciseIndex) => (
                    <div
                      key={exerciseIndex}
                      className="ml-2 space-y-1 border-t border-[#3A3A3A] pt-2"
                    >
                      <label className="block text-[#D1D1D1] text-xs font-semibold">
                        Ejercicio {exerciseIndex + 1}
                      </label>
                      <Input
                        name="name"
                        value={exercise.name}
                        onChange={(e) => handleExerciseChange(dayIndex, exerciseIndex, "name", e.target.value)}
                        placeholder="Press de banca"
                        className="bg-[#2D2D2D] border border-[#4A4A4A] text-white placeholder-[#B0B0B0] rounded-md p-2 text-xs w-full focus:ring-1 focus:ring-[#34C759] focus:border-transparent"
                      />
                      <div className="flex space-x-2">
                        <div className="w-1/2">
                          <Input
                            name="sets"
                            type="number"
                            value={exercise.sets}
                            onChange={(e) =>
                              handleExerciseChange(dayIndex, exerciseIndex, "sets", Number(e.target.value))
                            }
                            placeholder="Series"
                            className="bg-[#2D2D2D] border border-[#4A4A4A] text-white placeholder-[#B0B0B0] rounded-md p-2 text-xs w-full focus:ring-1 focus:ring-[#34C759] focus:border-transparent"
                          />
                        </div>
                        <div className="w-1/2">
                          <Input
                            name="reps"
                            type="number"
                            value={exercise.reps}
                            onChange={(e) =>
                              handleExerciseChange(dayIndex, exerciseIndex, "reps", Number(e.target.value))
                            }
                            placeholder="Reps"
                            className="bg-[#2D2D2D] border border-[#4A4A4A] text-white placeholder-[#B0B0B0] rounded-md p-2 text-xs w-full focus:ring-1 focus:ring-[#34C759] focus:border-transparent"
                          />
                        </div>
                      </div>
                    </div>
                  ))}
                  <Button
                    variant="secondary"
                    type="button"
                    onClick={() => handleAddExercise(dayIndex)}
                    className="mt-2 w-full bg-[#66BB6A] text-black hover:bg-[#4CAF50] rounded-md py-1 px-2 text-xs font-semibold border border-[#4CAF50] shadow-md"
                  >
                    + Ejercicio
                  </Button>
                </div>
              )}
            </Card>
          ))}

          <Button
            variant="secondary"
            type="button"
            onClick={handleAddDay}
            className="w-full bg-[#42A5F5] text-black hover:bg-[#1E88E5] rounded-md py-1 px-2 text-xs font-semibold border border-[#1E88E5] shadow-md"
          >
            + Día
          </Button>

          {error && <p className="text-red-500 text-xs font-medium">{error}</p>}

          <div className="flex space-x-2">
            <Button
              type="submit"
              disabled={loading}
              className="w-1/2 bg-[#66BB6A] text-black hover:bg-[#4CAF50] rounded-md py-1 px-2 text-xs font-semibold border border-[#4CAF50] shadow-md disabled:bg-[#4CAF50] disabled:opacity-50"
            >
              {loading ? "Creando..." : "Crear"}
            </Button>
            <Button
              type="button"
              onClick={() => router.push("/routine")}
              className="w-1/2 bg-[#EF5350] text-white hover:bg-[#D32F2F] rounded-md py-1 px-2 text-xs font-semibold border border-[#D32F2F] shadow-md disabled:bg-[#4CAF50] disabled:opacity-50"
            >
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}