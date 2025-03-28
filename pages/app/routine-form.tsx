import React, { useState, useEffect, useRef } from "react";
import { useDispatch } from "react-redux";
import { useRouter } from "next/router";
import { AppDispatch } from "../../store";
import { createRoutine, ThunkError } from "../../store/routineSlice";
import Button from "../../components/Button";
import Input from "../../components/Input";
import Card from "../../components/Card";
import Loader, { SmallLoader } from "../../components/Loader"; // Asegúrate de importar SmallLoader
import { IExercise } from "../../models/Exercise";
import { IDay } from "../../models/Day";
import { IRoutine } from "../../models/Routine";
import { Types } from "mongoose";

interface ExerciseFormData extends IExercise {
  isOpen: boolean;
}

interface DayFormData extends IDay {
  isOpen: boolean;
  exercises: ExerciseFormData[];
}

export default function RoutineFormPage() {
  const dispatch = useDispatch<AppDispatch>();
  const router = useRouter();

  const [routineName, setRoutineName] = useState("");
  const [days, setDays] = useState<DayFormData[]>([
    {
      dayName: "",
      musclesWorked: [],
      warmupOptions: [],
      explanation: "",
      exercises: [
        {
          _id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
          isOpen: true,
          name: "",
          muscleGroup: [],
          repsUnit: "count",
          weightUnit: "kg",
          weight: "",
          tips: [],
          videos: [],
          completed: false,
          rest: "",
          circuitId: "",
        } as unknown as ExerciseFormData,
      ],
      isOpen: true,
    } as unknown as DayFormData,
  ]);
  const [creatingRoutine, setCreatingRoutine] = useState(false); // Loader para crear rutina
  const [addingDay, setAddingDay] = useState(false); // Loader para agregar día
  const [addingExercise, setAddingExercise] = useState<Record<number, boolean>>({}); // Loader para agregar ejercicio por día
  const [deletingExercise, setDeletingExercise] = useState<Record<string, boolean>>({}); // Loader para eliminar ejercicio
  const [error, setError] = useState<string | null>(null);
  const [focusedExerciseId, setFocusedExerciseId] = useState<string | null>(null);
  const inputRefs = useRef<{ [key: string]: HTMLInputElement | null }>({});
  const selectRefs = useRef<{ [key: string]: HTMLSelectElement | null }>({});
  const [newCircuitId, setNewCircuitId] = useState<{ [key: string]: string | undefined }>({});

  const handleAddDay = async () => {
    setAddingDay(true);
    // Simulamos un pequeño retraso para que el loader sea visible
    await new Promise((resolve) => setTimeout(resolve, 300));
    setDays([
      ...days,
      {
        dayName: "",
        musclesWorked: [],
        warmupOptions: [],
        explanation: "",
        exercises: [
          {
            _id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
            isOpen: true,
            name: "",
            muscleGroup: [],
            repsUnit: "count",
            weightUnit: "kg",
            weight: "",
            tips: [],
            videos: [],
            completed: false,
            rest: "",
            circuitId: "",
          } as unknown as ExerciseFormData,
        ],
        isOpen: true,
      } as unknown as DayFormData,
    ]);
    setAddingDay(false);
  };

  const handleAddExercise = async (dayIndex: number) => {
    setAddingExercise((prev) => ({ ...prev, [dayIndex]: true }));
    await new Promise((resolve) => setTimeout(resolve, 300)); // Retraso artificial
    const updatedDays: DayFormData[] = [...days];
    updatedDays[dayIndex].exercises = updatedDays[dayIndex].exercises || [];
    updatedDays[dayIndex].exercises.push({
      _id: `temp-${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      isOpen: true,
      name: "",
      muscleGroup: [],
      repsUnit: "count",
      weightUnit: "kg",
      weight: "",
      tips: [],
      videos: [],
      completed: false,
      rest: "",
      circuitId: "",
    } as unknown as ExerciseFormData);
    setDays(updatedDays);
    setAddingExercise((prev) => ({ ...prev, [dayIndex]: false }));
  };

  const handleDeleteExercise = async (dayIndex: number, exerciseId: Types.ObjectId) => {
    setDeletingExercise((prev) => ({ ...prev, [exerciseId.toString()]: true }));
    await new Promise((resolve) => setTimeout(resolve, 300)); // Retraso artificial
    const updatedDays: DayFormData[] = [...days];
    updatedDays[dayIndex].exercises = updatedDays[dayIndex].exercises.filter(
      (exercise) => exerciseId !== exercise._id
    );
    setDays(updatedDays);
    setDeletingExercise((prev) => ({ ...prev, [exerciseId.toString()]: false }));
  };

  const handleDayChange = (dayId: Types.ObjectId, field: string, value: string) => {
    setFocusedExerciseId(null);
    const updatedDays = [...days];
    const dayIndex = updatedDays.findIndex((d) => d._id === dayId);
    if (dayIndex !== -1) {
      if (field === "musclesWorked" || field === "warmupOptions") {
        updatedDays[dayIndex] = { ...updatedDays[dayIndex], [field]: value.split(",") };
      } else {
        updatedDays[dayIndex] = { ...updatedDays[dayIndex], [field]: value };
      }
      setDays(updatedDays);
    }
  };

  const handleExerciseChange = (
    dayIndex: number,
    exerciseId: Types.ObjectId,
    field: string,
    value: string | number
  ) => {
    const updatedDays = [...days];
    const exerciseIndex = updatedDays[dayIndex].exercises.findIndex((ex) => ex._id === exerciseId);
    if (exerciseIndex !== -1) {
      if (typeof value === "string" && (field === "muscleGroup" || field === "tips")) {
        updatedDays[dayIndex].exercises[exerciseIndex] = {
          ...updatedDays[dayIndex].exercises[exerciseIndex],
          [field]: value.split(","),
        };
      } else {
        updatedDays[dayIndex].exercises[exerciseIndex] = {
          ...updatedDays[dayIndex].exercises[exerciseIndex],
          [field]: typeof value === "number" ? value : value,
        };
      }
      setDays(updatedDays);
      if (field === "circuitId" && value !== "new") {
        setFocusedExerciseId(exerciseId.toString());
      } else {
        setFocusedExerciseId("");
      }
    }
  };

  const toggleDay = (dayIndex: number) => {
    const updatedDays = [...days];
    updatedDays[dayIndex].isOpen = !updatedDays[dayIndex].isOpen;
    setDays(updatedDays);
  };

  const toggleExercises = (dayIndex: number, exerciseId: Types.ObjectId) => {
    const updatedDays = [...days];
    const exercise = updatedDays[dayIndex].exercises.find((ex) => ex._id === exerciseId);
    if (exercise) {
      exercise.isOpen = !exercise.isOpen;
      setDays(updatedDays);
    }
  };

  useEffect(() => {
    if (focusedExerciseId) {
      if (newCircuitId[focusedExerciseId]) {
        inputRefs.current[focusedExerciseId]?.focus();
      } else {
        selectRefs.current[focusedExerciseId]?.focus();
      }
    }
  }, [days, focusedExerciseId, newCircuitId]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (
      !routineName ||
      days.some((day) => !day.dayName || day.exercises.some((ex: Partial<IExercise>) => !ex.name))
    ) {
      setError("Todos los campos obligatorios deben estar completos");
      return;
    }

    setCreatingRoutine(true);
    setError(null);
    const cleanedDays = days.map((day: Partial<IDay>) => {
      const { ...dayRest } = day;
      if (dayRest._id && String(dayRest._id).startsWith("temp")) {
        delete dayRest._id;
      }
      return {
        ...dayRest,
        exercises: (day.exercises ?? []).map((exercise: Partial<IExercise>) => {
          const { ...exerciseRest } = exercise;
          if (exerciseRest._id && String(exerciseRest._id).startsWith("temp")) {
            delete exerciseRest._id;
          }
          return exerciseRest;
        }),
      };
    });
    try {
      await dispatch(createRoutine({ name: routineName, days: cleanedDays } as unknown as IRoutine)).unwrap();
      router.push("/app/routine");
    } catch (err) {
      const error = err as ThunkError;
      if (error.message === "Unauthorized" && error.status === 401) {
        router.push("/login");
      } else {
        setError("Error al crear la rutina");
        console.error(err);
      }
    } finally {
      setCreatingRoutine(false);
    }
  };

  const getExistingCircuitIds = (dayIndex: number) => {
    const circuitIds = new Set<string>();
    days[dayIndex].exercises.forEach((exercise) => {
      if (exercise.circuitId) {
        circuitIds.add(exercise.circuitId);
      }
    });
    return Array.from(circuitIds);
  };

  const groupExercisesByCircuit = (exercises: ExerciseFormData[]) => {
    const circuits: { [key: string]: ExerciseFormData[] } = {};
    const standalone: ExerciseFormData[] = [];

    exercises.forEach((exercise) => {
      if (exercise.circuitId) {
        if (!circuits[exercise.circuitId]) circuits[exercise.circuitId] = [];
        circuits[exercise.circuitId].push(exercise);
      } else {
        standalone.push(exercise);
      }
    });

    return { circuits, standalone };
  };

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
          {days.map((day, dayIndex) => {
            const { circuits, standalone } = groupExercisesByCircuit(day.exercises);
            const existingCircuitIds = getExistingCircuitIds(dayIndex);
            const isAddingExercise = addingExercise[dayIndex] || false;

            return (
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
                        onChange={(e) => handleDayChange(day._id, "dayName", e.target.value)}
                        placeholder="Pecho y Tríceps"
                        className="bg-[#2D2D2D] border border-[#4A4A4A] text-white placeholder-[#B0B0B0] rounded-md p-2 text-xs w-full focus:ring-1 focus:ring-[#34C759] focus:border-transparent"
                      />
                      <Input
                        name="musclesWorked"
                        value={day.musclesWorked.join(", ")}
                        onChange={(e) => handleDayChange(day._id, "musclesWorked", e.target.value)}
                        placeholder="Musculos trabajados (separados por comas)"
                        className="mt-2 bg-[#2D2D2D] border border-[#4A4A4A] text-white placeholder-[#B0B0B0] rounded-md p-2 text-xs w-full focus:ring-1 focus:ring-[#34C759] focus:border-transparent"
                      />
                      <Input
                        name="warmupOptions"
                        value={day.warmupOptions.join(", ")}
                        onChange={(e) => handleDayChange(day._id, "warmupOptions", e.target.value)}
                        placeholder="Calentamientos (Separados por comas)"
                        className="mt-2 bg-[#2D2D2D] border border-[#4A4A4A] text-white placeholder-[#B0B0B0] rounded-md p-2 text-xs w-full focus:ring-1 focus:ring-[#34C759] focus:border-transparent"
                      />
                      <Input
                        name="explanation"
                        value={day.explanation}
                        onChange={(e) => handleDayChange(day._id, "explanation", e.target.value)}
                        placeholder="Explicación"
                        className="mt-2 bg-[#2D2D2D] border border-[#4A4A4A] text-white placeholder-[#B0B0B0] rounded-md p-2 text-xs w-full focus:ring-1 focus:ring-[#34C759] focus:border-transparent"
                      />
                    </div>

                    {/* Circuitos */}
                    {Object.entries(circuits).map(([circuitId, exercises], circuitIndex) => (
                      <Card key={`circuit-${circuitIndex}`} className="p-2 bg-[#2D2D2D] rounded-md mb-2">
                        <h3 className="text-sm font-semibold text-[#34C759] mb-2">Circuito: {circuitId}</h3>
                        {exercises.map((exercise, exerciseIndex) => {
                          const isDeleting = deletingExercise[exercise._id.toString()] || false;
                          return (
                            <Card
                              key={exercise._id?.toString()}
                              className="p-2 bg-[#252525] border-2 border-[#4A4A4A] rounded-md mb-2"
                            >
                              <div
                                className="flex justify-between items-center cursor-pointer py-1 bg-[#2D2D2D] px-2 rounded-t-md"
                                onClick={() => toggleExercises(dayIndex, exercise._id)}
                              >
                                <h2 className="text-sm font-bold text-[#34C759]">
                                  {exercise.name || `Ejercicio ${exerciseIndex + 1}`}
                                </h2>
                                <span className="text-[#D1D1D1] text-xs">{exercise.isOpen ? "▲" : "▼"}</span>
                              </div>
                              {exercise.isOpen && (
                                <>
                                  <Input
                                    name="name"
                                    value={exercise.name}
                                    onChange={(e) =>
                                      handleExerciseChange(dayIndex, exercise._id, "name", e.target.value)
                                    }
                                    placeholder="Press de banca"
                                    className="mt-2 bg-[#2D2D2D] border border-[#4A4A4A] text-white placeholder-[#B0B0B0] rounded-md p-2 text-xs w-full focus:ring-1 focus:ring-[#34C759] focus:border-transparent"
                                  />
                                  <div className="mt-2">
                                    <label className="block text-[#D1D1D1] text-xs font-medium mb-1">
                                      ID del circuito
                                    </label>
                                    <select
                                      name="circuitId"
                                      value={exercise.circuitId || ""}
                                      onChange={(e) => {
                                        const value = e.target.value;
                                        if (value === "new") {
                                          setNewCircuitId((prev) => ({
                                            ...prev,
                                            [exercise._id.toString()]: "",
                                          }));
                                        } else {
                                          handleExerciseChange(dayIndex, exercise._id, "circuitId", value);
                                          setNewCircuitId((prev) => ({
                                            ...prev,
                                            [exercise._id.toString()]: undefined,
                                          }));
                                        }
                                      }}
                                      ref={(el) => {
                                        selectRefs.current[exercise._id.toString()] = el;
                                      }}
                                      className="bg-[#2D2D2D] border border-[#4A4A4A] text-white rounded-md p-2 text-xs w-full focus:ring-1 focus:ring-[#34C759] focus:border-transparent"
                                    >
                                      <option value="">Sin circuito</option>
                                      {existingCircuitIds.map((id) => (
                                        <option key={id} value={id}>
                                          {id}
                                        </option>
                                      ))}
                                      <option value="new">Agregar nuevo circuito</option>
                                    </select>
                                    {newCircuitId[exercise._id.toString()] !== undefined && (
                                      <Input
                                        name="newCircuitId"
                                        value={newCircuitId[exercise._id.toString()] || ""}
                                        onChange={(e) => {
                                          const value = e.target.value;
                                          setNewCircuitId((prev) => ({
                                            ...prev,
                                            [exercise._id.toString()]: value,
                                          }));
                                          handleExerciseChange(dayIndex, exercise._id, "circuitId", value);
                                        }}
                                        placeholder="Escribe un nuevo circuitId (ej. circuit-1)"
                                        className="mt-2 bg-[#2D2D2D] border border-[#4A4A4A] text-white placeholder-[#B0B0B0] rounded-md p-2 text-xs w-full focus:ring-1 focus:ring-[#34C759] focus:border-transparent"
                                        ref={(el) => {
                                          inputRefs.current[exercise._id.toString()] = el;
                                        }}
                                      />
                                    )}
                                  </div>
                                  <Input
                                    name="muscleGroup"
                                    value={exercise.muscleGroup.join(", ")}
                                    onChange={(e) =>
                                      handleExerciseChange(dayIndex, exercise._id, "muscleGroup", e.target.value)
                                    }
                                    placeholder="Musculos trabajados (separados por comas)"
                                    className="mt-2 bg-[#2D2D2D] border border-[#4A4A4A] text-white placeholder-[#B0B0B0] rounded-md p-2 text-xs w-full focus:ring-1 focus:ring-[#34C759] focus:border-transparent"
                                  />
                                  <Input
                                    name="tips"
                                    value={exercise.tips.join(", ")}
                                    onChange={(e) =>
                                      handleExerciseChange(dayIndex, exercise._id, "tips", e.target.value)
                                    }
                                    placeholder="Consejos (separados por comas)"
                                    className="mt-2 bg-[#2D2D2D] border border-[#4A4A4A] text-white placeholder-[#B0B0B0] rounded-md p-2 text-xs w-full focus:ring-1 focus:ring-[#34C759] focus:border-transparent"
                                  />
                                  <div className="mt-4 flex items-end space-x-2">
                                    <div className="w-1/3">
                                      <label className="block text-[#D1D1D1] text-xs font-semibold">Series</label>
                                      <Input
                                        name="sets"
                                        type="number"
                                        value={exercise.sets}
                                        onChange={(e) =>
                                          handleExerciseChange(dayIndex, exercise._id, "sets", Number(e.target.value))
                                        }
                                        placeholder="Series"
                                        className="bg-[#2D2D2D] border border-[#4A4A4A] text-white placeholder-[#B0B0B0] rounded-md p-2 text-xs w-full focus:ring-1 focus:ring-[#34C759] focus:border-transparent"
                                      />
                                    </div>
                                    <div className="w-1/3">
                                      <label className="block text-[#D1D1D1] text-xs font-semibold">
                                        Repeticiones/segundos
                                      </label>
                                      <Input
                                        name="reps"
                                        type="number"
                                        value={exercise.reps}
                                        onChange={(e) =>
                                          handleExerciseChange(dayIndex, exercise._id, "reps", Number(e.target.value))
                                        }
                                        placeholder="Reps"
                                        className="bg-[#2D2D2D] border border-[#4A4A4A] text-white placeholder-[#B0B0B0] rounded-md p-2 text-xs w-full focus:ring-1 focus:ring-[#34C759] focus:border-transparent"
                                      />
                                    </div>
                                    <div className="w-1/3">
                                      <label className="block text-[#D1D1D1] text-xs font-semibold">Descanso(s)</label>
                                      <Input
                                        name="rest"
                                        type="number"
                                        value={exercise.rest}
                                        onChange={(e) =>
                                          handleExerciseChange(dayIndex, exercise._id, "rest", Number(e.target.value))
                                        }
                                        placeholder="Descanso"
                                        className="bg-[#2D2D2D] border border-[#4A4A4A] text-white placeholder-[#B0B0B0] rounded-md p-2 text-xs w-full focus:ring-1 focus:ring-[#34C759] focus:border-transparent"
                                      />
                                    </div>
                                  </div>
                                  <Button
                                    type="button"
                                    disabled={day.exercises.length <= 1 || isDeleting}
                                    onClick={() => handleDeleteExercise(dayIndex, exercise._id)}
                                    className="mt-4 w-1/2 bg-[#EF5350] text-white hover:bg-[#D32F2F] rounded-md py-1 px-2 text-xs font-semibold border border-[#D32F2F] shadow-md disabled:bg-[#D32F2F] disabled:opacity-50"
                                  >
                                    {isDeleting ? <SmallLoader /> : "Eliminar ejercicio"}
                                  </Button>
                                </>
                              )}
                            </Card>
                          );
                        })}
                      </Card>
                    ))}

                    {/* Ejercicios individuales */}
                    {standalone.length > 0 && (
                      <Card className="p-2 bg-[#2D2D2D] rounded-md mb-2">
                        <h3 className="text-sm font-semibold text-white mb-2">Ejercicios Individuales</h3>
                        {standalone.map((exercise, exerciseIndex) => {
                          const isDeleting = deletingExercise[exercise._id.toString()] || false;
                          return (
                            <Card
                              key={exercise._id?.toString()}
                              className="p-2 bg-[#252525] border-2 border-[#4A4A4A] rounded-md mb-2"
                            >
                              <div
                                className="flex justify-between items-center cursor-pointer py-1 bg-[#2D2D2D] px-2 rounded-t-md"
                                onClick={() => toggleExercises(dayIndex, exercise._id)}
                              >
                                <h2 className="text-sm font-bold text-[#34C759]">
                                  {exercise.name || `Ejercicio ${exerciseIndex + 1}`}
                                </h2>
                                <span className="text-[#D1D1D1] text-xs">{exercise.isOpen ? "▲" : "▼"}</span>
                              </div>
                              {exercise.isOpen && (
                                <>
                                  <Input
                                    name="name"
                                    value={exercise.name}
                                    onChange={(e) =>
                                      handleExerciseChange(dayIndex, exercise._id, "name", e.target.value)
                                    }
                                    placeholder="Press de banca"
                                    className="mt-2 bg-[#2D2D2D] border border-[#4A4A4A] text-white placeholder-[#B0B0B0] rounded-md p-2 text-xs w-full focus:ring-1 focus:ring-[#34C759] focus:border-transparent"
                                  />
                                  <div className="mt-2">
                                    <label className="block text-[#D1D1D1] text-xs font-medium mb-1">
                                      ID del circuito
                                    </label>
                                    <select
                                      name="circuitId"
                                      value={exercise.circuitId || ""}
                                      onChange={(e) => {
                                        const value = e.target.value;
                                        if (value === "new") {
                                          setNewCircuitId((prev) => ({
                                            ...prev,
                                            [exercise._id.toString()]: "",
                                          }));
                                        } else {
                                          handleExerciseChange(dayIndex, exercise._id, "circuitId", value);
                                          setNewCircuitId((prev) => ({
                                            ...prev,
                                            [exercise._id.toString()]: undefined,
                                          }));
                                        }
                                      }}
                                      ref={(el) => {
                                        selectRefs.current[exercise._id.toString()] = el;
                                      }}
                                      className="bg-[#2D2D2D] border border-[#4A4A4A] text-white rounded-md p-2 text-xs w-full focus:ring-1 focus:ring-[#34C759] focus:border-transparent"
                                    >
                                      <option value="">Sin circuito</option>
                                      {existingCircuitIds.map((id) => (
                                        <option key={id} value={id}>
                                          {id}
                                        </option>
                                      ))}
                                      <option value="new">Agregar nuevo circuito</option>
                                    </select>
                                    {newCircuitId[exercise._id.toString()] !== undefined && (
                                      <Input
                                        name="newCircuitId"
                                        value={newCircuitId[exercise._id.toString()] || ""}
                                        onChange={(e) => {
                                          const value = e.target.value;
                                          setNewCircuitId((prev) => ({
                                            ...prev,
                                            [exercise._id.toString()]: value,
                                          }));
                                          handleExerciseChange(dayIndex, exercise._id, "circuitId", value);
                                        }}
                                        placeholder="Escribe un nuevo circuitId (ej. circuit-1)"
                                        className="mt-2 bg-[#2D2D2D] border border-[#4A4A4A] text-white placeholder-[#B0B0B0] rounded-md p-2 text-xs w-full focus:ring-1 focus:ring-[#34C759] focus:border-transparent"
                                        ref={(el) => {
                                          inputRefs.current[exercise._id.toString()] = el;
                                        }}
                                      />
                                    )}
                                  </div>
                                  <Input
                                    name="muscleGroup"
                                    value={exercise.muscleGroup.join(", ")}
                                    onChange={(e) =>
                                      handleExerciseChange(dayIndex, exercise._id, "muscleGroup", e.target.value)
                                    }
                                    placeholder="Musculos trabajados (separados por comas)"
                                    className="mt-2 bg-[#2D2D2D] border border-[#4A4A4A] text-white placeholder-[#B0B0B0] rounded-md p-2 text-xs w-full focus:ring-1 focus:ring-[#34C759] focus:border-transparent"
                                  />
                                  <Input
                                    name="tips"
                                    value={exercise.tips.join(", ")}
                                    onChange={(e) =>
                                      handleExerciseChange(dayIndex, exercise._id, "tips", e.target.value)
                                    }
                                    placeholder="Consejos (separados por comas)"
                                    className="mt-2 bg-[#2D2D2D] border border-[#4A4A4A] text-white placeholder-[#B0B0B0] rounded-md p-2 text-xs w-full focus:ring-1 focus:ring-[#34C759] focus:border-transparent"
                                  />
                                  <div className="mt-4 flex items-end space-x-2">
                                    <div className="w-1/3">
                                      <label className="block text-[#D1D1D1] text-xs font-semibold">Series</label>
                                      <Input
                                        name="sets"
                                        type="number"
                                        value={exercise.sets}
                                        onChange={(e) =>
                                          handleExerciseChange(dayIndex, exercise._id, "sets", Number(e.target.value))
                                        }
                                        placeholder="Series"
                                        className="bg-[#2D2D2D] border border-[#4A4A4A] text-white placeholder-[#B0B0B0] rounded-md p-2 text-xs w-full focus:ring-1 focus:ring-[#34C759] focus:border-transparent"
                                      />
                                    </div>
                                    <div className="w-1/3">
                                      <label className="block text-[#D1D1D1] text-xs font-semibold">
                                        Repeticiones/segundos
                                      </label>
                                      <Input
                                        name="reps"
                                        type="number"
                                        value={exercise.reps}
                                        onChange={(e) =>
                                          handleExerciseChange(dayIndex, exercise._id, "reps", Number(e.target.value))
                                        }
                                        placeholder="Reps"
                                        className="bg-[#2D2D2D] border border-[#4A4A4A] text-white placeholder-[#B0B0B0] rounded-md p-2 text-xs w-full focus:ring-1 focus:ring-[#34C759] focus:border-transparent"
                                      />
                                    </div>
                                    <div className="w-1/3">
                                      <label className="block text-[#D1D1D1] text-xs font-semibold">Descanso(s)</label>
                                      <Input
                                        name="rest"
                                        type="number"
                                        value={exercise.rest}
                                        onChange={(e) =>
                                          handleExerciseChange(dayIndex, exercise._id, "rest", Number(e.target.value))
                                        }
                                        placeholder="Descanso"
                                        className="bg-[#2D2D2D] border border-[#4A4A4A] text-white placeholder-[#B0B0B0] rounded-md p-2 text-xs w-full focus:ring-1 focus:ring-[#34C759] focus:border-transparent"
                                      />
                                    </div>
                                  </div>
                                  <Button
                                    type="button"
                                    disabled={day.exercises.length <= 1 || isDeleting}
                                    onClick={() => handleDeleteExercise(dayIndex, exercise._id)}
                                    className="mt-4 w-1/2 bg-[#EF5350] text-white hover:bg-[#D32F2F] rounded-md py-1 px-2 text-xs font-semibold border border-[#D32F2F] shadow-md disabled:bg-[#D32F2F] disabled:opacity-50"
                                  >
                                    {isDeleting ? <SmallLoader /> : "Eliminar ejercicio"}
                                  </Button>
                                </>
                              )}
                            </Card>
                          );
                        })}
                      </Card>
                    )}

                    <Button
                      variant="secondary"
                      type="button"
                      onClick={() => handleAddExercise(dayIndex)}
                      disabled={isAddingExercise}
                      className="mt-2 w-full bg-[#66BB6A] text-black hover:bg-[#4CAF50] rounded-md py-1 px-2 text-xs font-semibold border border-[#4CAF50] shadow-md disabled:bg-[#4CAF50] disabled:opacity-50"
                    >
                      {isAddingExercise ? <SmallLoader /> : "+ Ejercicio"}
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}

          <Button
            variant="secondary"
            type="button"
            onClick={handleAddDay}
            disabled={addingDay}
            className="w-full bg-[#42A5F5] text-black hover:bg-[#1E88E5] rounded-md py-1 px-2 text-xs font-semibold border border-[#1E88E5] shadow-md disabled:bg-[#1E88E5] disabled:opacity-50"
          >
            {addingDay ? <SmallLoader /> : "+ Día"}
          </Button>

          {error && <p className="text-red-500 text-xs font-medium">{error}</p>}

          <div className="flex space-x-2">
            <Button
              type="submit"
              disabled={creatingRoutine}
              className="w-1/2 bg-[#66BB6A] text-black hover:bg-[#4CAF50] rounded-md py-1 px-2 text-xs font-semibold border border-[#4CAF50] shadow-md disabled:bg-[#4CAF50] disabled:opacity-50"
            >
              {creatingRoutine ? <>Crear <Loader /></> : "Crear"}
            </Button>
            <Button
              type="button"
              onClick={() => router.push("/app/routine")}
              className="w-1/2 bg-[#EF5350] text-white hover:bg-[#D32F2F] rounded-md py-1 px-2 text-xs font-semibold border border-[#D32F2F] shadow-md"
            >
              Cancelar
            </Button>
          </div>
        </form>
      </div>
    </div>
  );
}