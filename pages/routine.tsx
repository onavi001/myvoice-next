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
import { dbConnect } from "../lib/mongodb";
import Button from "../components/Button";
import Input from "../components/Input";
import Textarea from "../components/Textarea";
import ProgressBar from "../components/ProgressBar";
import Card from "../components/Card";
import { RoutineData } from "../models/Routine";
import { IExercise } from "../models/Exercise";
import { updateExercise } from "../store/routineSlice";
import RoutineModel from "../models/Routine";
import DayModel, { IDay } from "../models/Day";
import ExerciseModel from "../models/Exercise";
import VideoModel, { IVideo } from "../models/Video";
import Loader, { SmallLoader } from "../components/Loader";

export default function RoutinePage({ initialRoutines }: { initialRoutines: RoutineData[] }) {
  const dispatch = useDispatch<AppDispatch>();
  const { routines, selectedRoutineIndex, loading, error } = useSelector((state: RootState) => state.routine);
  const { user, loading: userLoading } = useSelector((state: RootState) => state.user);
  const router = useRouter();

  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [expandedExercises, setExpandedExercises] = useState<Record<number, boolean>>({});
  const [editData, setEditData] = useState<Record<string, Partial<IExercise>>>({});
  const [loadingVideos, setLoadingVideos] = useState<Record<number, boolean>>({});
  const [videosVisible, setVideosVisible] = useState<Record<number, boolean>>({});

  const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY || "TU_CLAVE_API_YOUTUBE";
  
  useEffect(() => {
    const dayIndex = localStorage.getItem("dayIndex");
    setSelectedDayIndex(dayIndex ? parseInt(dayIndex) : 0);
    const routineIndex = localStorage.getItem("routineIndex");
    dispatch(selectRoutine(routineIndex ? parseInt(routineIndex) : 0))
  }, [])
  useEffect(() => {
    if (initialRoutines && routines.length === 0) {
      dispatch(fetchRoutines.fulfilled(initialRoutines, '', undefined));
    } else if (routines.length === 0) {
      dispatch(fetchRoutines());
    }
  }, [dispatch, initialRoutines, routines.length]);

  const fetchExerciseVideo = async (
    exerciseName: string,
    routineIndex: number,
    dayIndex: number,
    exerciseIndex: number
  ) => {
    setLoadingVideos((prev) => ({ ...prev, [exerciseIndex]: true }));
    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
          `${exerciseName} técnica de ejercicio`
        )}&type=video&maxResults=5&key=${YOUTUBE_API_KEY}`
      );
      const data = await response.json();
      if (data.items && data.items.length > 0) {
        const videoUrls = data.items.map((item: { id: { videoId: string; }; }) => `https://www.youtube.com/embed/${item.id.videoId}`);
        const videos = videoUrls.map((url: string, idx: number) => ({
          url,
          isCurrent: idx === 0,
        }));
        await dispatch(
          setExerciseVideos({
            routineId: routines[routineIndex]._id,
            dayIndex,
            exerciseIndex,
            videos,
          })
        ).unwrap();
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
    if (selectedRoutineIndex !== null && user) {
      const key = `${dayIndex}-${exerciseIndex}`;
      const updatedExercise = editData[key];
      if (updatedExercise) {
        const currentExercise = routines[selectedRoutineIndex].days[dayIndex].exercises[exerciseIndex];
        dispatch(
          addProgress({
            routineId: routines[selectedRoutineIndex]._id,
            dayIndex,
            exerciseIndex,
            sets: Number(updatedExercise.sets ?? currentExercise.sets),
            reps: Number(updatedExercise.reps ?? currentExercise.reps),
            repsUnit:  updatedExercise.repsUnit ?? currentExercise.repsUnit,
            weightUnit: updatedExercise.weightUnit ?? currentExercise.weightUnit,
            weight: updatedExercise.weight ?? currentExercise.weight ?? "",
            notes: updatedExercise.notes ?? currentExercise.notes ?? "",
            date: new Date(),
          })
        );
        // Actualizar el ejercicio en la base de datos
        dispatch(
          updateExercise({
            routineId: routines[selectedRoutineIndex]._id,
            dayId: routines[selectedRoutineIndex].days[dayIndex]._id,
            exerciseId: currentExercise._id,
            exerciseData: {
              sets: Number(updatedExercise.sets ?? currentExercise.sets),
              reps: Number(updatedExercise.reps ?? currentExercise.reps),
              repsUnit: updatedExercise.repsUnit ?? currentExercise.repsUnit,
              weightUnit: updatedExercise.weightUnit ?? currentExercise.weightUnit,
              weight: updatedExercise.weight ?? currentExercise.weight,
              notes: updatedExercise.notes ?? currentExercise.notes,
            },
          })
        );
        setEditData((prev) => {
          const newData = { ...prev };
          delete newData[key];
          return newData;
        });
      }
    }
  };

  const handleVideoAction = (
    action: "next" | "prev" | "toggle",
    routineIndex: number,
    dayIndex: number,
    exerciseIndex: number
  ) => {
    if (selectedRoutineIndex !== null) {
      const exercise = routines[routineIndex].days[dayIndex].exercises[exerciseIndex];
      if (action === "toggle") {
        setVideosVisible((prev) => ({
          ...prev,
          [exerciseIndex]: prev[exerciseIndex] !== undefined ? !prev[exerciseIndex] : false, // Alternar visibilidad
        }));
      } else if (exercise.videos && exercise.videos.length > 1) {
        const currentIndex = exercise.videos.findIndex((v) => v.isCurrent);
        const newIndex =
          action === "next"
            ? (currentIndex + 1) % exercise.videos.length
            : (currentIndex - 1 + exercise.videos.length) % exercise.videos.length;
        const updatedVideos = exercise.videos.map((v, idx) => ({
          ...v,
          isCurrent: idx === newIndex,
        }));
        dispatch(
          setExerciseVideos({
            routineId: routines[routineIndex]._id,
            dayIndex,
            exerciseIndex,
            videos: updatedVideos,
          })
        );
      }
    }
  };

  const handleToggleCompleted = (routineId: string, dayIndex: number, exerciseIndex: number) => {
    if (selectedRoutineIndex !== null) {
      const currentCompleted = routines[selectedRoutineIndex].days[dayIndex].exercises[exerciseIndex].completed;
      dispatch(updateExerciseCompleted({ routineId, dayIndex, exerciseIndex, completed: !currentCompleted }));
    }
  };

  const calculateDayProgress = (day: RoutineData["days"][number]) => {
    const total = day.exercises.length;
    const completed = day.exercises.filter((ex) => ex.completed).length;
    return total > 0 ? (completed / total) * 100 : 0;
  };

  const calculateWeekProgress = (routine: RoutineData) => {
    const total = routine.days.reduce((sum, day) => sum + day.exercises.length, 0);
    const completed = routine.days.reduce((sum, day) => sum + day.exercises.filter((ex) => ex.completed).length, 0);
    return total > 0 ? (completed / total) * 100 : 0;
  };

  if (userLoading || loading) return <Loader/>;
  if (error) return <div className="min-h-screen bg-[#1A1A1A] text-white flex items-center justify-center">Error: {error}</div>;

  if (routines.length === 0) {
    return (
      <div className="min-h-screen bg-[#1A1A1A] text-white flex flex-col">
        <div className="p-4 max-w-md mx-auto mt-16">
          <h2 className="text-sm font-semibold text-white mb-3 truncate">Tu Rutina</h2>
          <p className="text-[#B0B0B0] text-xs">No hay rutinas generadas. Genera una desde la página principal.</p>
          <Button onClick={() => router.push("/routine-AI")} className="mt-3">Generar Rutina con IA</Button>
          <Button onClick={() => router.push("/routine-form")} className="mt-3">Agregar Rutina Manual</Button>
          <Button onClick={() => router.push("/")} className="mt-3">Volver</Button>
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
      <div className="p-4 max-w-full mx-auto flex-1">
        <div className="flex overflow-x-auto space-x-2 mb-4 scrollbar-hidden">
          {routines.map((routine, index) => (
            <button
              key={routine._id}
              onClick={() => {
                dispatch(selectRoutine(index));
                localStorage.setItem("routineIndex", index.toString())
                setSelectedDayIndex(0);
                setExpandedExercises({});
                setVideosVisible({});
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
          {selectedRoutine.days.map((day, index) => (
            <button
              key={day._id}
              onClick={() => {setSelectedDayIndex(index);localStorage.setItem("dayIndex", index.toString());}}
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
              <ul className="list-disc pl-3 text-[#FFFFFF] text-xs  max-w-full">
                {selectedDay.musclesWorked.map((muscle, index) => (
                  <li key={index}>{muscle}</li>
                ))}
              </ul>
            </div>
            <div className="flex items-center">
              <span className="text-[#B0B0B0] font-semibold text-xs min-w-[100px]">🔥 Calentamiento:</span>
              <ul className="list-disc pl-3 text-[#FFFFFF] text-xs  max-w-full">
                {selectedDay.warmupOptions.map((option, index) => (
                  <li key={index}>{option}</li>
                ))}
              </ul>
            </div>
          </div>
        </Card>
        <ul className="space-y-2">
          {selectedDay.exercises.map((exercise, exerciseIndex) => {
            const key = `${selectedDayIndex}-${exerciseIndex}`;
            const edited = editData[key] || {};
            const currentExercise = { ...exercise, ...edited };
            const isExpanded = expandedExercises[exerciseIndex] || false;
            const isLoading = loadingVideos[exerciseIndex] || false;
            const areVideosVisible = videosVisible[exerciseIndex] ?? true;

            return (
              <Card key={exercise._id} className="overflow-hidden">
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
                            {currentExercise.tips.map((tip, index) => (
                              <li key={index}>{tip}</li>
                            ))}
                          </ul>
                        </div>
                      )}
                    </div>
                    {currentExercise.videos && currentExercise.videos.length > 0 ? (
                      <div>
                        {
                          areVideosVisible &&
                          <iframe
                            src={Array.isArray(currentExercise.videos) && 'isCurrent' in currentExercise.videos[0] ? (currentExercise.videos.find((v) => (v as IVideo).isCurrent) as IVideo)?.url || (currentExercise.videos[0] as IVideo).url : ""}
                            title={`Demostración de ${exercise.name}`}
                            className="w-full h-32 rounded border border-[#4A4A4A]"
                            frameBorder="0"
                            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                            allowFullScreen
                          />
                        }
                        {currentExercise.videos.length > 1 && (
                          <div className="mt-2 flex" style={{justifyContent: "space-around"}}>
                            {areVideosVisible && <Button
                              onClick={() =>
                                handleVideoAction("prev", selectedRoutineIndex, selectedDayIndex, exerciseIndex)
                              }
                              className="w-auto bg-transparent text-white hover:bg-transparent rounded-full py-1 px-2 text-xs font-semibold border border-[#2DBF4E]"
                            >
                              {"<< Anterior"}
                            </Button>}
                            <Button
                              onClick={() =>
                                handleVideoAction("toggle", selectedRoutineIndex, selectedDayIndex, exerciseIndex)
                              }
                              className="w-auto bg-transparent text-white hover:bg-transparent rounded-full py-1 px-2 text-xs font-semibold border border-[#2DBF4E]"
                            >
                              {areVideosVisible ? "Esconder" : "Mostrar videos"}
                            </Button>
                            {areVideosVisible && <Button
                              onClick={() =>
                                handleVideoAction("next", selectedRoutineIndex, selectedDayIndex, exerciseIndex)
                              }
                              className="w-auto bg-transparent text-white hover:bg-transparent rounded-full py-1 px-2 text-xs font-semibold border border-[#2DBF4E] "
                            >
                              {"Siguiente >>"}
                            </Button>}
                          </div>
                        )}
                      </div>
                    ) : isLoading ? (
                      <div className="text-center">
                        <SmallLoader/>
                        <p className="text-[#B0B0B0] italic">Cargando video...</p>
                      </div>
                    ) : (
                      <p className="text-[#B0B0B0] italic text-center">Video no disponible</p>
                    )}
                    <div className="grid grid-cols-3 gap-1">
                      <div>
                        <label className="text-[#B0B0B0]">Series:</label>
                        <Input
                          name="sets"
                          type="number"
                          value={currentExercise.sets || ""}
                          onChange={(e) =>
                            handleInputChange(selectedDayIndex, exerciseIndex, "sets", Number(e.target.value))
                          }
                        />
                      </div>
                      <div>
                        <label className="text-[#B0B0B0]">Reps:</label>
                        <Input
                          name="reps"
                          type="number"
                          value={currentExercise.reps || ""}
                          onChange={(e) =>
                            handleInputChange(selectedDayIndex, exerciseIndex, "reps", Number(e.target.value))
                          }
                        />
                      </div>
                      <div>
                        <label className="text-[#B0B0B0]">Unidad Reps:</label>
                        <select
                          name="repsUnit"
                          value={currentExercise.repsUnit || "count"}
                          onChange={(e) => handleInputChange(selectedDayIndex, exerciseIndex, "repsUnit", e.target.value)}
                          className="w-full bg-[#2D2D2D] border border-[#4A4A4A] text-white p-2 rounded-md text-xs"
                        >
                          <option value="count">Unidades (U)</option>
                          <option value="seconds">Segundos (S)</option>
                        </select>
                      </div>
                    </div>
                    <div className="grid grid-cols-3 gap-1">
                      <div>
                        <label className="text-[#B0B0B0]">Peso:</label>
                        <Input
                          name="weight"
                          value={currentExercise.weight || ""}
                          onChange={(e) => handleInputChange(selectedDayIndex, exerciseIndex, "weight", e.target.value)}
                        />
                      </div>
                      <div>
                        <label className="text-[#B0B0B0]">Unidad:</label>
                        <select
                          name="weightUnit"
                          value={currentExercise.weightUnit || "kg"}
                          onChange={(e) => handleInputChange(selectedDayIndex, exerciseIndex, "weightUnit", e.target.value)}
                          className="w-full bg-[#2D2D2D] border border-[#4A4A4A] text-white p-2 rounded-md text-xs"
                        >
                          <option value="kg">Kilos (kg)</option>
                          <option value="lb">Libras (lb)</option>
                        </select>
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
                    <Button onClick={() => handleSave(selectedDayIndex, exerciseIndex)} className="w-full">
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
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "my-super-secret-key") as { userId: string };

    const routines = await RoutineModel.find({ userId: decoded.userId })
      .populate({
        path: "days",
        model: DayModel,
        populate: {
          path: "exercises",
          model: ExerciseModel,
          populate: {
            path: "videos",
            model: VideoModel,
          },
        },
      })
      .lean();

    const serializedRoutines: RoutineData[] = routines.map((r) => ({
      _id: r._id.toString(),
      userId: r.userId.toString(),
      name: r.name,
      days: r.days.map((day: Partial<IDay>) => ({
        _id: day._id?.toString() || "",
        dayName: day.dayName || "",
        musclesWorked: day.musclesWorked || [],
        warmupOptions: day.warmupOptions || [],
        explanation: day.explanation || "",
        exercises: (day.exercises || []).map((exercise: Partial<IExercise>) => ({
          _id: exercise._id?.toString() || "",
          name: exercise.name || "",
          muscleGroup: exercise.muscleGroup || [],
          sets: exercise.sets || 0,
          reps: exercise.reps || 0,
          repsUnit: exercise.repsUnit || "count",
          weightUnit: exercise.weightUnit || "kg",
          weight: exercise.weight || "",
          rest: exercise.rest || "",
          tips: exercise.tips || [],
          completed: exercise.completed || false,
          videos: exercise.videos?.map((video: Partial<IVideo>) => ({
            _id: video._id?.toString() || "",
            url: video.url || "",
            isCurrent: video.isCurrent || false,
          })) || [],
          notes: exercise.notes || "",
        })),
      })),
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : new Date().toISOString(),
    }));

    return { props: { initialRoutines: serializedRoutines } };
  } catch (error) {
    console.error("Error en getServerSideProps:", error);
    return { redirect: { destination: "/", permanent: false } };
  }
};