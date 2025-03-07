import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../store";
import {
  fetchRoutines,
  selectRoutine,
  updateExerciseCompleted,
  setExerciseVideos,
} from "../store/routineSlice";
import { addProgress } from "../store/progressSlice";
import { useRouter } from "next/router";
import { GetServerSideProps } from "next";
import jwt from "jsonwebtoken";
import {dbConnect} from "../lib/mongodb";
import Button from "../components/Button";
import Input from "../components/Input";
import Textarea from "../components/Textarea";
import ProgressBar from "../components/ProgressBar";
import Card from "../components/Card";

export default function RoutinePage({ initialRoutines }: { initialRoutines: any[] }) {
  const dispatch = useDispatch<AppDispatch>();
  const { routines, selectedRoutineIndex, loading, error } = useSelector((state: RootState) => state.routine);
  const { user, loading: userLoading } = useSelector((state: RootState) => state.user);
  const router = useRouter();

  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [expandedExercises, setExpandedExercises] = useState<Record<number, boolean>>({});
  const [editData, setEditData] = useState<Record<string, any>>({});
  const [loadingVideos, setLoadingVideos] = useState<Record<number, boolean>>({});

  const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY || "TU_CLAVE_API_YOUTUBE";

  useEffect(() => {
    if (!user && !userLoading) {
      router.push("/");
    } else if (user && routines.length === 0) {
      dispatch(fetchRoutines());
    }
  }, [dispatch, user, userLoading, router, routines]);

  const fetchExerciseVideo = async (exerciseName: string, routineIndex: number, dayIndex: number, exerciseIndex: number) => {
    setLoadingVideos((prev) => ({ ...prev, [exerciseIndex]: true }));
    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
          `${exerciseName} exercise technique muscles`
        )}&type=video&maxResults=5&key=${YOUTUBE_API_KEY}`
      );
      console.log()
      const data = await response.json();
      if (data.items && data.items.length > 0) {
        const videoUrls = data.items.map((item: any) => `https://www.youtube.com/embed/${item.id.videoId}`);
        const videos = videoUrls.map((url: string, idx: number) => ({
          url,
          isCurrent: idx === 0,
        }));
        await dispatch(setExerciseVideos({
          routineId: routines[routineIndex]._id,
          dayIndex,
          exerciseIndex,
          videos,
        })).unwrap();
      }
    } catch (error) {
      console.error("Error fetching YouTube video:", error);
    } finally {
      setLoadingVideos((prev) => ({ ...prev, [exerciseIndex]: false }));
    }
  };

  const toggleExerciseExpand = (exerciseIndex: number, exerciseName: string) => {
    const isExpanding = !expandedExercises[exerciseIndex];
    setExpandedExercises((prev) => ({
      ...prev,
      [exerciseIndex]: isExpanding,
    }));

    if (isExpanding && selectedRoutineIndex !== null) {
      const exercise = routines[selectedRoutineIndex].days[selectedDayIndex].exercises[exerciseIndex];
      if (!exercise.videos || exercise.videos.length === 0) {
        fetchExerciseVideo(exerciseName, selectedRoutineIndex, selectedDayIndex, exerciseIndex);
      }
    }
  };

  const handleInputChange = (dayIndex: number, exerciseIndex: number, field: string, value: string | number) => {
    if (selectedRoutineIndex !== null) {
      const key = `${dayIndex}-${exerciseIndex}`;
      setEditData((prev) => ({
        ...prev,
        [key]: { ...prev[key] || {}, [field]: value },
      }));
    }
  };

  const handleSave = (dayIndex: number, exerciseIndex: number) => {
    if (selectedRoutineIndex !== null) {
      const key = `${dayIndex}-${exerciseIndex}`;
      const updatedExercise = editData[key];
      if (updatedExercise) {
        const currentExercise = routines[selectedRoutineIndex].days[dayIndex].exercises[exerciseIndex];
        dispatch(addProgress({
          routineId: routines[selectedRoutineIndex]._id,
          dayIndex: dayIndex,
          exerciseIndex: exerciseIndex,
          sets: Number(updatedExercise.sets || currentExercise.sets),
          reps: Number(updatedExercise.reps || currentExercise.reps),
          weight: updatedExercise.weight || currentExercise.weight || "",
          notes: updatedExercise.notes || currentExercise.notes || "",
          userId: user!._id,
          date: ""
        }));
        // Actualizamos el ejercicio en la rutina (simulamos updateExercise)
        const updatedRoutines = [...routines];
        updatedRoutines[selectedRoutineIndex].days[dayIndex].exercises[exerciseIndex] = {
          ...currentExercise,
          ...updatedExercise,
        };
        dispatch(fetchRoutines()); // Refetch para simular (puedes crear un action específico)
        setEditData((prev) => {
          const newData = { ...prev };
          delete newData[key];
          return newData;
        });
      }
    }
  };

  const handleChangeVideo = (direction: "next" | "prev", routineIndex: number, dayIndex: number, exerciseIndex: number) => {
    if (selectedRoutineIndex !== null) {
      const exercise = routines[routineIndex].days[dayIndex].exercises[exerciseIndex];
      if (exercise.videos && exercise.videos.length > 1) {
        const currentIndex = exercise.videos.findIndex((v: any) => v.isCurrent);
        const newIndex = direction === "next"
          ? (currentIndex + 1) % exercise.videos.length
          : (currentIndex - 1 + exercise.videos.length) % exercise.videos.length;
        const updatedVideos = exercise.videos.map((v: any, idx: number) => ({
          ...v,
          isCurrent: idx === newIndex,
        }));
        dispatch(setExerciseVideos({
          routineId: routines[routineIndex]._id,
          dayIndex,
          exerciseIndex,
          videos: updatedVideos,
        }));
      }
    }
  };

  const handleToggleCompleted = (routineId: string, dayIndex: number, exerciseIndex: number) => {
    dispatch(updateExerciseCompleted({ routineId, dayIndex, exerciseIndex, completed: !routines[selectedRoutineIndex!].days[dayIndex].exercises[exerciseIndex].completed }));
  };

  const calculateDayProgress = (day: any) => {
    const total = day.exercises.length;
    const completed = day.exercises.filter((ex: any) => ex.completed).length;
    return total > 0 ? (completed / total) * 100 : 0;
  };

  const calculateWeekProgress = (routine: any) => {
    const total = routine.days.reduce((sum: number, day: any) => sum + day.exercises.length, 0);
    const completed = routine.days.reduce((sum: number, day: any) => sum + day.exercises.filter((ex: any) => ex.completed).length, 0);
    return total > 0 ? (completed / total) * 100 : 0;
  };

  if (userLoading || loading) return <div className="min-h-screen bg-[#1A1A1A] text-white flex items-center justify-center">Cargando...</div>;
  if (error) return <div className="min-h-screen bg-[#1A1A1A] text-white flex items-center justify-center">Error: {error}</div>;
  if (!user) return null;

  if (routines.length === 0) {
    return (
      <div className="min-h-screen bg-[#1A1A1A] text-white flex flex-col">
        <div className="p-4 max-w-md mx-auto mt-16">
          <h2 className="text-sm font-semibold text-white mb-3 truncate">Tu Rutina</h2>
          <p className="text-[#B0B0B0] text-xs">No hay rutinas generadas. Genera una desde la página principal.</p>
          <Button onClick={() => router.push("/routine-form")} className="mt-3">Agregar Rutina Manual</Button>
          <Button variant="secondary" onClick={() => router.push("/")} className="mt-3">Volver</Button>
        </div>
      </div>
    );
  }

  if (selectedRoutineIndex === null || !routines[selectedRoutineIndex]) {
    return (
      <div className="min-h-screen bg-[#1A1A1A] text-white flex flex-col">
        <div className="p-4 max-w-md mx-auto mt-16">
          <h2 className="text-sm font-semibold text-white mb-3 truncate">Tu Rutina</h2>
          <p className="text-[#B0B0B0] text-xs">Selecciona una rutina para ver los detalles.</p>
          <Button onClick={() => router.push("/routine-form")} className="mt-3">Agregar Rutina Manual</Button>
          <Button variant="secondary" onClick={() => router.push("/")} className="mt-3">Volver</Button>
        </div>
      </div>
    );
  }

  const selectedRoutine = routines[selectedRoutineIndex];
  const selectedDay = selectedRoutine.days[selectedDayIndex];

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-white flex flex-col">
      <div className="p-4 max-w-full mx-auto flex-1 mt-16">
        <div className="flex overflow-x-auto space-x-2 mb-4 scrollbar-hidden">
          {routines.map((routine, index) => (
            <button
              key={routine._id}
              onClick={() => {
                dispatch(selectRoutine(index));
                setSelectedDayIndex(0);
                setExpandedExercises({});
              }}
              className={`px-2 py-1 rounded-full text-xs font-medium transition-colors shadow-sm truncate max-w-[120px] ${
                selectedRoutineIndex === index ? "bg-white text-black" : "bg-[#2D2D2D] text-[#B0B0B0] hover:bg-[#4A4A4A]"
              }`}
            >
              {routine.name}
            </button>
          ))}
        </div>
        <ProgressBar progress={calculateWeekProgress(selectedRoutine)} label="Progreso Semanal" />
        <div className="flex overflow-x-auto space-x-2 mb-4 scrollbar-hidden">
          {selectedRoutine.days.map((day: any, index: number) => (
            <button
              key={index}
              onClick={() => setSelectedDayIndex(index)}
              className={`px-2 py-1 rounded-full text-xs font-medium transition-colors shadow-sm truncate max-w-[120px] ${
                selectedDayIndex === index ? "bg-white text-black" : "bg-[#2D2D2D] text-[#B0B0B0] hover:bg-[#4A4A4A]"
              }`}
            >
              {day.dayName}
            </button>
          ))}
        </div>
        <ProgressBar progress={calculateDayProgress(selectedDay)} label="Progreso Día" />
        <Card className="mb-4 max-h-24 overflow-y-auto scrollbar-hidden">
          <div className="flex flex-col space-y-1">
            <div className="flex items-center">
              <span className="text-[#B0B0B0] font-semibold text-xs min-w-[100px]">🏋️ Músculos:</span>
              <span className="text-[#FFFFFF] text-xs flex-1">{selectedDay.musclesWorked.join(", ")}</span>
            </div>
            <div className="flex items-center">
              <span className="text-[#B0B0B0] font-semibold text-xs min-w-[100px]">🔥 Calentamiento:</span>
              <span className="text-[#FFFFFF] text-xs flex-1">{selectedDay.warmupOptions.join(", ")}</span>
            </div>
          </div>
        </Card>
        <ul className="space-y-2">
          {selectedDay.exercises.map((exercise: any, exerciseIndex: number) => {
            const key = `${selectedDayIndex}-${exerciseIndex}`;
            const edited = editData[key] || {};
            const currentExercise = { ...exercise, ...edited };
            const isExpanded = expandedExercises[exerciseIndex] || false;
            const isLoading = loadingVideos[exerciseIndex] || false;

            return (
              <Card key={exerciseIndex} className="overflow-hidden">
                <button
                  onClick={() => toggleExerciseExpand(exerciseIndex, exercise.name)}
                  className="w-full flex justify-between items-center p-2 text-left hover:bg-[#4A4A4A] transition-colors"
                >
                  <div className="flex items-center">
                    <input
                      type="checkbox"
                      checked={currentExercise.completed || false}
                      onChange={() => handleToggleCompleted(selectedRoutine._id, selectedDayIndex, exerciseIndex)}
                      onClick={(e) => e.stopPropagation()}
                      className="mr-2 accent-[#34C759]"
                    />
                    <span className="text-sm font-semibold text-white truncate">{exercise.name}</span>
                  </div>
                  <span className="text-[#B0B0B0] text-xs">{isExpanded ? "▲" : "▼"}</span>
                </button>
                {isExpanded && (
                  <div className="p-2 bg-[#4A4A4A] text-xs space-y-2">
                    <div className="grid grid-cols-2 gap-1">
                      <div>
                        <span className="text-[#B0B0B0] font-semibold">Músculo:</span>
                        <p className="text-[#FFFFFF]">{currentExercise.muscleGroup}</p>
                      </div>
                      {currentExercise.tips && currentExercise.tips.length > 0 && (
                        <div>
                          <span className="text-[#B0B0B0] font-semibold">Consejos:</span>
                          <ul className="list-disc pl-3 text-[#FFFFFF] max-w-full">
                            {currentExercise.tips.map((tip: string, index: number) => (
                              <li key={index}>{tip}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    {currentExercise.videos && currentExercise.videos.length > 0 ? (
                      <div>
                        <iframe
                          src={currentExercise.videos.find((v: any) => v.isCurrent)?.url || currentExercise.videos[0].url}
                          title={`Demostración de ${exercise.name}`}
                          className="w-full h-32 rounded border border-[#4A4A4A]"
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                        />
                        {currentExercise.videos.length > 1 && (
                          <div className="flex justify-between mt-2">
                            <Button
                              onClick={() => handleChangeVideo("prev", selectedRoutineIndex, selectedDayIndex, exerciseIndex)}
                              className="px-2 py-1 text-xs"
                              variant="secondary"
                            >
                              Anterior
                            </Button>
                            <Button
                              onClick={() => handleChangeVideo("next", selectedRoutineIndex, selectedDayIndex, exerciseIndex)}
                              className="px-2 py-1 text-xs"
                              variant="secondary"
                            >
                              Siguiente
                            </Button>
                          </div>
                        )}
                      </div>
                    ) : isLoading ? (
                      <div className="text-center">
                        <p className="text-[#B0B0B0] italic">Cargando video...</p>
                      </div>
                    ) : (
                      <p className="text-[#B0B0B0] italic text-center">Video no disponible</p>
                    )}
                    <div className="grid grid-cols-2 gap-1">
                      <div>
                        <label className="text-[#B0B0B0]">Series:</label>
                        <Input
                          name="sets"
                          type="number"
                          value={currentExercise.sets || ""}
                          onChange={(e) => handleInputChange(selectedDayIndex, exerciseIndex, "sets", Number(e.target.value))}
                        />
                      </div>
                      <div>
                        <label className="text-[#B0B0B0]">Reps:</label>
                        <Input
                          name="reps"
                          type="number"
                          value={currentExercise.reps || ""}
                          onChange={(e) => handleInputChange(selectedDayIndex, exerciseIndex, "reps", Number(e.target.value))}
                        />
                      </div>
                      <div>
                        <label className="text-[#B0B0B0]">Peso:</label>
                        <Input
                          name="weight"
                          value={currentExercise.weight || ""}
                          onChange={(e) => handleInputChange(selectedDayIndex, exerciseIndex, "weight", e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-[#B0B0B0]">Notas:</label>
                        <Textarea
                          name="notes"
                          value={currentExercise.notes || ""}
                          onChange={(e) => handleInputChange(selectedDayIndex, exerciseIndex, "notes", e.target.value)}
                          className="h-8 resize-none"
                        />
                      </div>
                    </div>
                    <Button
                      onClick={() => handleSave(selectedDayIndex, exerciseIndex)}
                      className="w-full"
                    >
                      Guardar
                    </Button>
                  </div>
                )}
              </Card>
            );
          })}
        </ul>
        {selectedDay.explanation && (
          <p className="mt-3 text-[#B0B0B0] italic text-xs bg-[#2D2D2D] p-2 rounded shadow-sm">
            {selectedDay.explanation}
          </p>
        )}
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const token = context.req.cookies.token;
  if (!token) {
    return { redirect: { destination: "/", permanent: false } };
  }

  try {
    await dbConnect();
    const Routine = (await import("../models/routines")).default;
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "my-super-secret-key") as { userId: string };
    const routines = await Routine.find({ userId: decoded.userId }).lean();
    return { props: { initialRoutines: JSON.parse(JSON.stringify(routines)) } };
  } catch (error) {
    return { redirect: { destination: "/", permanent: false } };
  }
};