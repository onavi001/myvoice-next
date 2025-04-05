import React, { useState, useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../../store";
import {
  fetchRoutines,
  selectRoutine,
  updateExerciseCompleted,
  setExerciseVideos,
  ThunkError,
} from "../../store/routineSlice";
import { addProgress } from "../../store/progressSlice";
import { useRouter } from "next/router";
import { GetServerSideProps } from "next";
import jwt from "jsonwebtoken";
import { dbConnect } from "../../lib/mongodb";
import Button from "../../components/Button";
import Input from "../../components/Input";
import Textarea from "../../components/Textarea";
import ProgressBar from "../../components/ProgressBar";
import Card from "../../components/Card";
import { RoutineData } from "../../models/Routine";
import { IExercise } from "../../models/Exercise";
import { updateExercise } from "../../store/routineSlice";
import RoutineModel from "../../models/Routine";
import DayModel, { IDay } from "../../models/Day";
import ExerciseModel from "../../models/Exercise";
import VideoModel, { IVideo } from "../../models/Video";
import Loader, { FuturisticLoader, SmallLoader } from "../../components/Loader";
import { Types } from "mongoose";
import { ArrowPathIcon, PlayCircleIcon, EyeIcon } from "@heroicons/react/16/solid";
import Modal from "../../components/Modal";
import ModelWorkoutModal from "../../components/ModelWorkoutModal";

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
  const [savingProgress, setSavingProgress] = useState<Record<string, boolean>>({});
  const [togglingCompleted, setTogglingCompleted] = useState<Record<number, boolean>>({});
  const [switchingVideos, setSwitchingVideos] = useState<Record<number, boolean>>({});
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [generatedExercises, setGeneratedExercises] = useState<Partial<IExercise & { videoUrl: string }>[]>([]);
  const [loadingGeneratedExercise, setLoadingGeneratedExercise] = useState(false);
  const [expandedVideos, setExpandedVideos] = useState<Record<number, boolean>>({});
  const [currentDayIndex, setCurrentDayIndex] = useState<number | null>(null);
  const [currentExerciseIndex, setCurrentExerciseIndex] = useState<number | null>(null);
  const [exerciseInProgress, setExerciseInProgress] = useState<Record<string, boolean>>({});
  const [openBodyModal,setOpenBodyModal] = useState<boolean>(false);
  const [musclesToShow, setMusclesToShow] = useState<string[]>([]);
  const YOUTUBE_API_KEY = process.env.NEXT_PUBLIC_YOUTUBE_API_KEY || "TU_CLAVE_API_YOUTUBE";
  useEffect(() => {
    if (routines.length > 0) {
      const dayIndex = localStorage.getItem("dayIndex");
      setSelectedDayIndex(dayIndex ? parseInt(dayIndex) : 0);
      const routineIndex = localStorage.getItem("routineIndex");
      dispatch(selectRoutine(routineIndex ? parseInt(routineIndex) : 0));
    }
  }, [dispatch, routines]);

  useEffect(() => {
    if (initialRoutines && routines.length === 0) {
      dispatch(fetchRoutines.fulfilled(initialRoutines, "", undefined));
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
    const exercise = routines[routineIndex]?.days[dayIndex]?.exercises[exerciseIndex];
    if (exercise?.videos?.length > 0) return;

    setLoadingVideos((prev) => ({ ...prev, [exerciseIndex]: true }));
    try {
      const response = await fetch(
        `https://www.googleapis.com/youtube/v3/search?part=snippet&q=${encodeURIComponent(
          `${exerciseName} técnica de ejercicio`
        )}&type=video&maxResults=5&key=${YOUTUBE_API_KEY}`
      );
      const data = await response.json();
      if (data.items && data.items.length > 0) {
        const videoUrls = data.items.map((item: { id: { videoId: string } }) => `https://www.youtube.com/embed/${item.id.videoId}`);
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
    } catch (err) {
      const error = err as ThunkError;
      if (error.message === "Unauthorized" && error.status === 401) {
        router.push("/login");
      } else {
        console.error("Error fetching YouTube video:", error);
      }
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

  const handleSave = async (dayIndex: number, exerciseIndex: number) => {
    if (selectedRoutineIndex !== null && user) {
      const key = `${dayIndex}-${exerciseIndex}`;
      setSavingProgress((prev) => ({ ...prev, [key]: true }));
      try {
        const updatedExercise = editData[key];
        if (updatedExercise) {
          const currentExercise = routines[selectedRoutineIndex].days[dayIndex].exercises[exerciseIndex];
          //primero el ejercicio
          await dispatch(
            updateExercise({
              routineId: routines[selectedRoutineIndex]._id,
              dayId: routines[selectedRoutineIndex].days[dayIndex]._id,
              exerciseId: currentExercise._id,
              exerciseData: {
                sets: Number(updatedExercise.sets ?? currentExercise.sets),
                reps: Number(updatedExercise.reps ?? currentExercise.reps),
                repsUnit: updatedExercise.repsUnit ?? currentExercise.repsUnit,
                rest: updatedExercise.rest ?? currentExercise.rest,
                weightUnit: updatedExercise.weightUnit ?? currentExercise.weightUnit,
                weight: updatedExercise.weight ?? currentExercise.weight,
                notes: updatedExercise.notes ?? currentExercise.notes,
                
              },
            })
          ).unwrap();
          const validProgress = Object.keys(editData[key]).filter(key => key !== "rest");
          //despues el progreso si es que existe algun cambio
          if(validProgress){
            await dispatch(
              addProgress({
                name: currentExercise.name,
                sets: Number(updatedExercise.sets ?? currentExercise.sets),
                reps: Number(updatedExercise.reps ?? currentExercise.reps),
                repsUnit: updatedExercise.repsUnit ?? currentExercise.repsUnit,
                weightUnit: updatedExercise.weightUnit ?? currentExercise.weightUnit,
                weight: updatedExercise.weight ?? currentExercise.weight ?? "",
                notes: updatedExercise.notes ?? currentExercise.notes ?? "",
                date: new Date(),
              })
            ).unwrap();
          }
          
          setEditData((prev) => {
            const newData = { ...prev };
            delete newData[key];
            return newData;
          });
        }
      } catch (err) {
        const error = err as ThunkError;
        if (error.message === "Unauthorized" && error.status === 401) {
          router.push("/login");
        } else {
          console.error("Error saving progress:", error);
        }
      } finally {
        setSavingProgress((prev) => ({ ...prev, [key]: false }));
      }
    }
  };

  const handleStartExercise = (dayIndex: number, exerciseIndex: number) => {
    const key = `${dayIndex}-${exerciseIndex}`;
    const restTime = selectedRoutineIndex !== null 
      ? routines[selectedRoutineIndex].days[dayIndex].exercises[exerciseIndex].rest 
      : null;
    setExerciseInProgress((prev) => ({ ...prev, [key]: true }));
    if (restTime) {
      const timeInSeconds = parseInt(restTime, 10);
      setTimeout(() => {
        setExerciseInProgress((prev) => ({ ...prev, [key]: false }));
        if (selectedRoutineIndex !== null) {
          //agregar una alarma
          const audio = new Audio("/alarmas/alarma1.mp3");
          audio.play().catch(error => console.error('Error al reproducir audio:', error));
        }
      }, timeInSeconds * 1000);
    }
  };

  const toggleVideoExpansion = (index: number) => {
    setExpandedVideos((prev) => ({
      ...prev,
      [index]: !prev[index],
    }));
  };

  const handleNewExercise = async (dayIndex: number, exerciseIndex: number) => {
    if (selectedRoutineIndex === null || !user) {
      console.error("No hay rutina seleccionada o usuario no autenticado");
      return;
    }
    const routine = routines[selectedRoutineIndex];
    const exercise = routine.days[dayIndex].exercises[exerciseIndex];
    setLoadingGeneratedExercise(true);
    setCurrentDayIndex(dayIndex);
    setCurrentExerciseIndex(exerciseIndex);

    try {
      const response = await fetch("/api/exercises/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          dayExercises: routine.days[dayIndex].exercises,
          exerciseToChangeId: exercise._id,
        }),
      });
      const data = await response.json();
      if (!response.ok) {
        console.error("Error generating new exercises:", data);
        return;
      }
      setGeneratedExercises(data);
      setIsModalOpen(true);
      setExpandedVideos({});
    } catch (err) {
      const error = err as ThunkError;
      if (error.message === "Unauthorized" && error.status === 401) {
        router.push("/login");
      } else {
        console.error("Error generating new exercise:", error);
      }
    } finally {
      setLoadingGeneratedExercise(false);
    }
  };

  const handleSelectExercise = async (selectedExercise: Partial<IExercise & { videoUrl: string }>) => {
    if (!user || selectedRoutineIndex === null || currentDayIndex === null || currentExerciseIndex === null) return;

    const routine = routines[selectedRoutineIndex];
    const dayId = routine.days[currentDayIndex]._id;
    const exerciseId = routine.days[currentDayIndex].exercises[currentExerciseIndex]._id;

    try {
      await dispatch(
        updateExercise({
          routineId: routine._id,
          dayId,
          exerciseId,
          exerciseData: {
            name: selectedExercise.name,
            sets: selectedExercise.sets,
            reps: selectedExercise.reps,
            repsUnit: selectedExercise.repsUnit,
            weightUnit: selectedExercise.weightUnit,
            weight: selectedExercise.weight,
          },
        })
      ).unwrap();

      setIsModalOpen(false);
      setGeneratedExercises([]);
      setExpandedVideos({});
      setCurrentDayIndex(null);
      setCurrentExerciseIndex(null);
    } catch (err) {
      const error = err as ThunkError;
      if (error.message === "Unauthorized" && error.status === 401) {
        router.push("/login");
      } else {
        console.error("Error actualizando el ejercicio:", error);
      }
    }
  };

  const handleVideoAction = async (
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
          [exerciseIndex]: prev[exerciseIndex] !== undefined ? !prev[exerciseIndex] : false,
        }));
      } else if (exercise.videos && exercise.videos.length > 1) {
        setSwitchingVideos((prev) => ({ ...prev, [exerciseIndex]: true }));
        try {
          const currentIndex = exercise.videos.findIndex((v) => v.isCurrent);
          const newIndex =
            action === "next"
              ? (currentIndex + 1) % exercise.videos.length
              : (currentIndex - 1 + exercise.videos.length) % exercise.videos.length;
          const updatedVideos = exercise.videos.map((v, idx) => ({
            ...v,
            isCurrent: idx === newIndex,
          }));
          await dispatch(
            setExerciseVideos({
              routineId: routines[routineIndex]._id,
              dayIndex,
              exerciseIndex,
              videos: updatedVideos,
            })
          ).unwrap();
        } catch (err) {
          const error = err as ThunkError;
          if (error.message === "Unauthorized" && error.status === 401) {
            router.push("/login");
          } else {
            console.error("Error switching video:", error);
          }
        } finally {
          setSwitchingVideos((prev) => ({ ...prev, [exerciseIndex]: false }));
        }
      }
    }
  };

  const handleResetRoutineProgress = async (routineId: Types.ObjectId) => {
    if (selectedRoutineIndex === null) return;
  
    const days = routines[selectedRoutineIndex].days;
    for (const currentDays of days) {
      const dayIndex = days.indexOf(currentDays);
      handleResetDayProgress(routineId,dayIndex)
    }
  }

  const handleResetDayProgress = async (routineId: Types.ObjectId, dayIndex: number) => {
    if (selectedRoutineIndex === null) return;
  
    const exercises = routines[selectedRoutineIndex].days[dayIndex].exercises;
  
    for (const currentExercise of exercises) {
      const exerciseIndex = exercises.indexOf(currentExercise);
  
      setTogglingCompleted((prev) => ({ ...prev, [exerciseIndex]: true }));
  
      try {
        await dispatch(
          updateExerciseCompleted({
            routineId,
            dayIndex,
            exerciseIndex,
            completed: false,
          })
        ).unwrap();
      } catch (err) {
        const error = err as ThunkError;
        if (error.message === "Unauthorized" && error.status === 401) {
          router.push("/login");
          return; // Salir si hay error de autorización
        } else {
          console.error("Error toggling completed:", error);
        }
      } finally {
        setTogglingCompleted((prev) => ({ ...prev, [exerciseIndex]: false }));
      }
    }
  };
  
  const handleToggleCompleted = async (routineId: Types.ObjectId, dayIndex: number, exerciseIndex: number) => {
    if (selectedRoutineIndex !== null) {
      setTogglingCompleted((prev) => ({ ...prev, [exerciseIndex]: true }));
      try {
        const currentCompleted = routines[selectedRoutineIndex].days[dayIndex].exercises[exerciseIndex].completed;
        await dispatch(
          updateExerciseCompleted({ routineId, dayIndex, exerciseIndex, completed: !currentCompleted })
        ).unwrap();
      } catch (err) {
        const error = err as ThunkError;
        if (error.message === "Unauthorized" && error.status === 401) {
          router.push("/login");
        } else {
          console.error("Error toggling completed:", error);
        }
      } finally {
        setTogglingCompleted((prev) => ({ ...prev, [exerciseIndex]: false }));
      }
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

  const groupExercisesByCircuit = (exercises: IExercise[]) => {
    const circuits: { [key: string]: IExercise[] } = {};
    const standalone: IExercise[] = [];

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

  if (userLoading || loading) return <Loader />;
  if (loadingGeneratedExercise) return <FuturisticLoader />;
  if (error) return <div className="min-h-screen bg-[#1A1A1A] text-white flex items-center justify-center">Error: {error}</div>;

  if (routines.length === 0) {
    return (
      <div className="min-h-screen bg-[#1A1A1A] text-white flex flex-col">
        <div className="p-4 max-w-md mx-auto mt-16">
          <h2 className="text-sm font-semibold text-white mb-3 truncate">Tu Rutina</h2>
          <p className="text-[#B0B0B0] text-xs">No hay rutinas generadas. Genera una desde la página principal.</p>
          <Button onClick={() => router.push("/app/routine-AI")} className="mt-3">Generar Rutina con IA</Button>
          <Button onClick={() => router.push("/app/routine-form")} className="mt-3">Agregar Rutina Manual</Button>
          <Button onClick={() => router.push("/app")} className="mt-3">Volver</Button>
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
          <Button onClick={() => router.push("/app/routine-form")} className="mt-3">Agregar Rutina Manual</Button>
          <Button variant="secondary" onClick={() => router.push("/app")} className="mt-3">Volver</Button>
        </div>
      </div>
    );
  }
  //#region 
  const selectedRoutine = routines[selectedRoutineIndex] ? routines[selectedRoutineIndex] : routines[0];

  const selectedDay = selectedRoutine.days[selectedDayIndex] ? selectedRoutine.days[selectedDayIndex] : selectedRoutine.days[0];

  const { circuits, standalone } = groupExercisesByCircuit(selectedDay?.exercises as unknown as IExercise[]);
  //#endregion
  
  return (
    <div className="min-h-screen bg-[#1A1A1A] text-white flex flex-col">
      <div className="p-4 max-w-full mx-auto flex-1">
        <div className="flex overflow-x-auto space-x-2 mb-4 scrollbar-hidden">
          {routines.map((routine, index) => (
            <button
              key={routine._id.toString()}
              onClick={() => {
                dispatch(selectRoutine(index));
                localStorage.setItem("routineIndex", index.toString());
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
        <ProgressBar 
          progress={calculateWeekProgress(selectedRoutine)} 
          label="Progreso Semanal" 
          resetFunction={() => handleResetRoutineProgress(selectedRoutine._id)}
        />
        <div className="flex overflow-x-auto space-x-2 mb-4 scrollbar-hidden">
          {selectedRoutine.days.map((day, index) => (
            <button
              key={day._id.toString()}
              onClick={() => {
                setSelectedDayIndex(index);
                localStorage.setItem("dayIndex", index.toString());
              }}
              className={`px-2 py-1 rounded-full text-xs font-medium transition-colors shadow-sm truncate max-w-[120px] ${
                selectedDayIndex === index ? "bg-white text-black" : "bg-[#2D2D2D] text-[#B0B0B0] hover:bg-[#4A4A4A]"
              }`}
            >
              {day.dayName}
            </button>
          ))}
        </div>
        <ProgressBar
          progress={calculateDayProgress(selectedDay)}
          label="Progreso Día"
          resetFunction={() => handleResetDayProgress(selectedRoutine._id, selectedDayIndex)}
        />
        <Card className="mb-4 max-h-24 overflow-y-auto scrollbar-hidden">
          <div className="mx-5 grid grid-cols-2 gap-1">
            <div className="items-center">
              <button onClick={()=>{setOpenBodyModal(true);setMusclesToShow(selectedDay.musclesWorked);}} className="flex text-[#B0B0B0] font-semibold text-xs min-w-[100px]">
                🏋️ Músculos: 
                <EyeIcon className="w-4 h-4 ml-2" />
              </button>
              <ul className="list-disc pl-3 text-[#FFFFFF] text-xs max-w-full">
                <li>{selectedDay.musclesWorked.join(", ")}</li>
              </ul>
              {openBodyModal && <ModelWorkoutModal musclesToShow={musclesToShow} isOpen={openBodyModal} onClose={()=>setOpenBodyModal(false)} />}
            </div>
            <div className="items-center">
              <span className="text-[#B0B0B0] font-semibold text-xs min-w-[100px]">🔥 Calentamiento:</span>
              <ul className="list-disc pl-3 text-[#FFFFFF] text-xs max-w-full">
                {selectedDay.warmupOptions.map((option, index) => (
                  <li key={index}>{option}</li>
                ))}
              </ul>
            </div>
          </div>
        </Card>

        {/* Circuitos */}
        {Object.entries(circuits).map(([circuitId, exercises]) => (
          <div key={`circuit-${circuitId}`} className="mb-4">
            <h3 className="text-sm font-semibold text-[#34C759] mb-2">Circuito: {circuitId}</h3>
            <ul className="space-y-2">
              {exercises.map((exercise) => {
                const globalIndex = selectedDay.exercises.findIndex((ex) => ex._id === exercise._id);
                const key = `${selectedDayIndex}-${globalIndex}`;
                const edited = editData[key] || {};
                const currentExercise = { ...exercise, ...edited };
                const isExpanded = expandedExercises[globalIndex] || false;
                const isLoadingVideos = loadingVideos[globalIndex] || false;
                const isSaving = savingProgress[key] || false;
                const isToggling = togglingCompleted[globalIndex] || false;
                const isSwitching = switchingVideos[globalIndex] || false;
                const areVideosVisible = videosVisible[globalIndex] ?? true;
                const isInProgress = exerciseInProgress[key] || false;

                return (
                  <Card key={exercise._id.toString()} className="overflow-hidden">
                    <button
                      onClick={() => toggleExerciseExpand(globalIndex, exercise.name)}
                      className="w-full flex justify-between items-center p-2 text-left hover:bg-[#4A4A4A] transition-colors"
                    >
                      <div className="flex items-center">
                        {isToggling ? (
                          <Loader />
                        ) : (
                          <input
                            type="checkbox"
                            checked={currentExercise.completed || false}
                            onChange={() => handleToggleCompleted(selectedRoutine._id, selectedDayIndex, globalIndex)}
                            onClick={(e) => e.stopPropagation()}
                            className="mr-2 accent-[#34C759]"
                          />
                        )}
                        <span className="text-sm font-semibold text-white truncate">{exercise.name}</span>
                      </div>
                      <span className="text-[#B0B0B0] text-xs">{isExpanded ? "▲" : "▼"}</span>
                    </button>
                    {isExpanded && (
                      <div className="p-2 bg-[#4A4A4A] text-xs space-y-2">
                        <div className="grid grid-cols-2 gap-1">
                          <div>
                            <button onClick={()=>{setOpenBodyModal(true);setMusclesToShow(currentExercise.muscleGroup);}} className="flex text-[#B0B0B0] font-semibold">
                              Músculo:
                              <EyeIcon className="w-4 h-4 ml-2" />
                            </button>
                            <p className="text-[#FFFFFF]">{currentExercise.muscleGroup.join(", ")}</p>
                            <Button
                              onClick={() => handleNewExercise(selectedDayIndex, globalIndex)}
                              disabled={loadingGeneratedExercise}
                              className="my-4 flex items-center gap-1 bg-[#34C759] text-black px-2 py-1 rounded-full text-xs hover:bg-[#2ca44e] disabled:opacity-50"
                            >
                              <ArrowPathIcon className="w-4 h-4" />
                              <span>Regenerar</span>
                            </Button>
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
                            {areVideosVisible && (
                              <iframe
                                src={
                                  Array.isArray(currentExercise.videos) && "isCurrent" in currentExercise.videos[0]
                                    ? (currentExercise.videos.find((v) => (v as IVideo).isCurrent) as IVideo)?.url ||
                                      (currentExercise.videos[0] as IVideo).url
                                    : ""
                                }
                                title={`Demostración de ${exercise.name}`}
                                className="w-full h-32 rounded border border-[#4A4A4A]"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              />
                            )}
                            {currentExercise.videos.length > 1 && (
                              <div className="mt-2 flex" style={{ justifyContent: "space-around" }}>
                                {areVideosVisible && (
                                  <Button
                                    onClick={() =>
                                      handleVideoAction("prev", selectedRoutineIndex, selectedDayIndex, globalIndex)
                                    }
                                    className="w-auto bg-transparent text-white hover:bg-transparent rounded-full py-1 px-2 text-xs font-semibold border border-[#2DBF4E]"
                                    disabled={isSwitching}
                                  >
                                    {isSwitching ? <SmallLoader /> : "<< Anterior"}
                                  </Button>
                                )}
                                <Button
                                  onClick={() =>
                                    handleVideoAction("toggle", selectedRoutineIndex, selectedDayIndex, globalIndex)
                                  }
                                  className="w-auto bg-transparent text-white hover:bg-transparent rounded-full py-1 px-2 text-xs font-semibold border border-[#2DBF4E]"
                                >
                                  {areVideosVisible ? "Esconder" : "Mostrar videos"}
                                </Button>
                                {areVideosVisible && (
                                  <Button
                                    onClick={() =>
                                      handleVideoAction("next", selectedRoutineIndex, selectedDayIndex, globalIndex)
                                    }
                                    className="w-auto bg-transparent text-white hover:bg-transparent rounded-full py-1 px-2 text-xs font-semibold border border-[#2DBF4E]"
                                    disabled={isSwitching}
                                  >
                                    {isSwitching ? <SmallLoader /> : "Siguiente >>"}
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        ) : isLoadingVideos ? (
                          <div className="text-center">
                            <SmallLoader />
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
                                handleInputChange(selectedDayIndex, globalIndex, "sets", Number(e.target.value))
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
                                handleInputChange(selectedDayIndex, globalIndex, "reps", Number(e.target.value))
                              }
                            />
                          </div>
                          <div>
                            <label className="text-[#B0B0B0]">Unidad Reps:</label>
                            <select
                              name="repsUnit"
                              value={currentExercise.repsUnit || "count"}
                              onChange={(e) => handleInputChange(selectedDayIndex, globalIndex, "repsUnit", e.target.value)}
                              className="w-full bg-[#2D2D2D] border border-[#4A4A4A] text-white p-2 rounded-md text-xs"
                            >
                              <option value="count">Unidades (U)</option>
                              <option value="seconds">Segundos (S)</option>
                            </select>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-1">
                          <div>
                            <label className="text-[#B0B0B0]">Descanso:</label>
                            <div className="grid grid-cols-2 gap-1">
                              <Input
                                name="rest"
                                value={currentExercise.rest || ""}
                                onChange={(e) => handleInputChange(selectedDayIndex, globalIndex, "rest", e.target.value)}
                              />
                              <Button
                                onClick={() => handleStartExercise(selectedDayIndex, globalIndex)}
                                className="flex items-center bg-[#34C759] text-black rounded-full text-xs hover:bg-[#2ca44e] disabled:opacity-50"
                                disabled={isInProgress}
                              >
                                <span className="ml-1">Rest</span>
                                <PlayCircleIcon className="w-4 h-4 ml-2" />
                              </Button>
                            </div>
                          </div>
                          <div>
                            <label className="text-[#B0B0B0]">Peso:</label>
                            <Input
                              name="weight"
                              value={currentExercise.weight || ""}
                              onChange={(e) => handleInputChange(selectedDayIndex, globalIndex, "weight", e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="text-[#B0B0B0]">Unidad:</label>
                            <select
                              name="weightUnit"
                              value={currentExercise.weightUnit || "kg"}
                              onChange={(e) => handleInputChange(selectedDayIndex, globalIndex, "weightUnit", e.target.value)}
                              className="w-full bg-[#2D2D2D] border border-[#4A4A4A] text-white p-2 rounded-md text-xs"
                            >
                              <option value="kg">Kilos (kg)</option>
                              <option value="lb">Libras (lb)</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="text-[#B0B0B0]">Notas:</label>
                          <Textarea
                            name="notes"
                            value={currentExercise.notes || ""}
                            onChange={(e) => handleInputChange(selectedDayIndex, globalIndex, "notes", e.target.value)}
                            className="h-8 resize-none"
                          />
                        </div>
                        <Button
                          onClick={() => handleSave(selectedDayIndex, globalIndex)}
                          className="w-full disabled:opacity-50"
                          disabled={!editData[`${selectedDayIndex}-${globalIndex}`] || isSaving}
                        >
                          {isSaving ? (
                            <>
                              <Loader />
                              Guardar
                            </>
                          ) : (
                            "Guardar"
                          )}
                        </Button>
                      </div>
                    )}
                  </Card>
                );
              })}
            </ul>
          </div>
        ))}

        {/* Ejercicios Individuales */}
        {standalone.length > 0 && (
          <div className="mb-4">
            <h3 className="text-sm font-semibold text-white mb-2">Ejercicios Individuales</h3>
            <ul className="space-y-2">
              {standalone.map((exercise) => {
                const globalIndex = selectedDay.exercises.findIndex((ex) => ex._id === exercise._id);
                const key = `${selectedDayIndex}-${globalIndex}`;
                const edited = editData[key] || {};
                const currentExercise = { ...exercise, ...edited };
                const isExpanded = expandedExercises[globalIndex] || false;
                const isLoadingVideos = loadingVideos[globalIndex] || false;
                const isSaving = savingProgress[key] || false;
                const isToggling = togglingCompleted[globalIndex] || false;
                const isSwitching = switchingVideos[globalIndex] || false;
                const areVideosVisible = videosVisible[globalIndex] ?? true;
                const isInProgress = exerciseInProgress[key] || false;

                return (
                  <Card key={exercise._id.toString()} className="overflow-hidden">
                    <button
                      onClick={() => toggleExerciseExpand(globalIndex, exercise.name)}
                      className="w-full flex justify-between items-center p-2 text-left hover:bg-[#4A4A4A] transition-colors"
                    >
                      <div className="flex items-center">
                        {isToggling ? (
                          <Loader />
                        ) : (
                          <input
                            type="checkbox"
                            checked={currentExercise.completed || false}
                            onChange={() => handleToggleCompleted(selectedRoutine._id, selectedDayIndex, globalIndex)}
                            onClick={(e) => e.stopPropagation()}
                            className="mr-2 accent-[#34C759]"
                          />
                        )}
                        <span className="text-sm font-semibold text-white truncate">{exercise.name}</span>
                      </div>
                      <span className="text-[#B0B0B0] text-xs">{isExpanded ? "▲" : "▼"}</span>
                    </button>
                    {isExpanded && (
                      <div className="p-2 bg-[#4A4A4A] text-xs space-y-2">
                        <div className="grid grid-cols-2 gap-1">
                          <div>
                            <button onClick={()=>{setOpenBodyModal(true);setMusclesToShow(currentExercise.muscleGroup);}} className="flex text-[#B0B0B0] font-semibold">
                              Músculo:
                              <EyeIcon className="w-4 h-4 ml-2" />
                            </button>
                            <p className="text-[#FFFFFF]">{currentExercise.muscleGroup.join(", ")}</p>
                            <Button
                              onClick={() => handleNewExercise(selectedDayIndex, globalIndex)}
                              disabled={loadingGeneratedExercise}
                              className="my-4 flex items-center gap-1 bg-[#34C759] text-black px-2 py-1 rounded-full text-xs hover:bg-[#2ca44e] disabled:opacity-50"
                            >
                              <ArrowPathIcon className="w-4 h-4" />
                              <span>Regenerar</span>
                            </Button>
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
                            {areVideosVisible && (
                              <iframe
                                src={
                                  Array.isArray(currentExercise.videos) && "isCurrent" in currentExercise.videos[0]
                                    ? (currentExercise.videos.find((v) => (v as IVideo).isCurrent) as IVideo)?.url ||
                                      (currentExercise.videos[0] as IVideo).url
                                    : ""
                                }
                                title={`Demostración de ${exercise.name}`}
                                className="w-full h-32 rounded border border-[#4A4A4A]"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              />
                            )}
                            {currentExercise.videos.length > 1 && (
                              <div className="mt-2 flex" style={{ justifyContent: "space-around" }}>
                                {areVideosVisible && (
                                  <Button
                                    onClick={() =>
                                      handleVideoAction("prev", selectedRoutineIndex, selectedDayIndex, globalIndex)
                                    }
                                    className="w-auto bg-transparent text-white hover:bg-transparent rounded-full py-1 px-2 text-xs font-semibold border border-[#2DBF4E]"
                                    disabled={isSwitching}
                                  >
                                    {isSwitching ? <SmallLoader /> : "<< Anterior"}
                                  </Button>
                                )}
                                <Button
                                  onClick={() =>
                                    handleVideoAction("toggle", selectedRoutineIndex, selectedDayIndex, globalIndex)
                                  }
                                  className="w-auto bg-transparent text-white hover:bg-transparent rounded-full py-1 px-2 text-xs font-semibold border border-[#2DBF4E]"
                                >
                                  {areVideosVisible ? "Esconder" : "Mostrar videos"}
                                </Button>
                                {areVideosVisible && (
                                  <Button
                                    onClick={() =>
                                      handleVideoAction("next", selectedRoutineIndex, selectedDayIndex, globalIndex)
                                    }
                                    className="w-auto bg-transparent text-white hover:bg-transparent rounded-full py-1 px-2 text-xs font-semibold border border-[#2DBF4E]"
                                    disabled={isSwitching}
                                  >
                                    {isSwitching ? <SmallLoader /> : "Siguiente >>"}
                                  </Button>
                                )}
                              </div>
                            )}
                          </div>
                        ) : isLoadingVideos ? (
                          <div className="text-center">
                            <SmallLoader />
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
                                handleInputChange(selectedDayIndex, globalIndex, "sets", Number(e.target.value))
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
                                handleInputChange(selectedDayIndex, globalIndex, "reps", Number(e.target.value))
                              }
                            />
                          </div>
                          <div>
                            <label className="text-[#B0B0B0]">Unidad Reps:</label>
                            <select
                              name="repsUnit"
                              value={currentExercise.repsUnit || "count"}
                              onChange={(e) => handleInputChange(selectedDayIndex, globalIndex, "repsUnit", e.target.value)}
                              className="w-full bg-[#2D2D2D] border border-[#4A4A4A] text-white p-2 rounded-md text-xs"
                            >
                              <option value="count">Unidades (U)</option>
                              <option value="seconds">Segundos (S)</option>
                            </select>
                          </div>
                        </div>
                        <div className="grid grid-cols-3 gap-1">
                          <div>
                            <label className="text-[#B0B0B0]">Descanso:</label>
                            <div className="grid grid-cols-2 gap-1">
                              <Input
                                name="rest"
                                value={currentExercise.rest || ""}
                                onChange={(e) => handleInputChange(selectedDayIndex, globalIndex, "rest", e.target.value)}
                              />
                              <Button
                                onClick={() => handleStartExercise(selectedDayIndex, globalIndex)}
                                className="flex items-center bg-[#34C759] text-black rounded-full text-xs hover:bg-[#2ca44e] disabled:opacity-50"
                                disabled={isInProgress}
                              >
                                <span className="ml-1">Rest</span>
                                <PlayCircleIcon className="w-4 h-4 ml-2" />
                              </Button>
                            </div>
                          </div>
                          <div>
                            <label className="text-[#B0B0B0]">Peso:</label>
                            <Input
                              name="weight"
                              value={currentExercise.weight || ""}
                              onChange={(e) => handleInputChange(selectedDayIndex, globalIndex, "weight", e.target.value)}
                            />
                          </div>
                          <div>
                            <label className="text-[#B0B0B0]">Unidad:</label>
                            <select
                              name="weightUnit"
                              value={currentExercise.weightUnit || "kg"}
                              onChange={(e) => handleInputChange(selectedDayIndex, globalIndex, "weightUnit", e.target.value)}
                              className="w-full bg-[#2D2D2D] border border-[#4A4A4A] text-white p-2 rounded-md text-xs"
                            >
                              <option value="kg">Kilos (kg)</option>
                              <option value="lb">Libras (lb)</option>
                            </select>
                          </div>
                        </div>
                        <div>
                          <label className="text-[#B0B0B0]">Notas:</label>
                          <Textarea
                            name="notes"
                            value={currentExercise.notes || ""}
                            onChange={(e) => handleInputChange(selectedDayIndex, globalIndex, "notes", e.target.value)}
                            className="h-8 resize-none"
                          />
                        </div>
                        <Button
                          onClick={() => handleSave(selectedDayIndex, globalIndex)}
                          className="w-full disabled:opacity-50"
                          disabled={!editData[`${selectedDayIndex}-${globalIndex}`] || isSaving}
                        >
                          {isSaving ? (
                            <>
                              <Loader />
                              Guardar
                            </>
                          ) : (
                            "Guardar"
                          )}
                        </Button>
                      </div>
                    )}
                  </Card>
                );
              })}
            </ul>
          </div>
        )}

        {selectedDay.explanation && (
          <p className="mt-3 text-[#B0B0B0] italic text-xs bg-[#2D2D2D] p-2 rounded shadow-sm">
            {selectedDay.explanation}
          </p>
        )}
      </div>

      {/* Modal con max-height y scroll */}
      <Modal isOpen={isModalOpen} onClose={() => setIsModalOpen(false)}>
        <h3 className="text-sm font-bold text-[#34C759] mb-2">Selecciona un nuevo ejercicio</h3>
        <div className="max-h-[400px] overflow-y-auto scrollbar-hidden">
          <ul className="space-y-4">
            {generatedExercises.map((exercise, index) => {
              const isExpanded = expandedVideos[index] || false;

              return (
                <li key={index} className="p-2 bg-[#2D2D2D] rounded-md">
                  <div className="cursor-pointer hover:bg-[#3A3A3A] p-2 rounded-md">
                    <div className="flex justify-between items-center" onClick={() => toggleVideoExpansion(index)}>
                      <span className="text-xs text-white">
                        {exercise.name} - {exercise.sets}x{exercise.reps}{" "}
                        {exercise.weight ? `(${exercise.weight} ${exercise.weightUnit})` : ""}
                      </span>
                      <span className="text-[#D1D1D1] text-xs">{isExpanded ? "▲" : "▼"}</span>
                    </div>
                    {isExpanded && (
                      <div className="mt-2">
                        <iframe
                          width="100%"
                          height="150"
                          src={exercise.videoUrl}
                          title={exercise.name}
                          frameBorder="0"
                          allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                          allowFullScreen
                          className="rounded-md"
                        />
                      </div>
                    )}
                  </div>
                  <Button
                    onClick={() => handleSelectExercise(exercise)}
                    className="mt-2 w-full bg-[#34C759] text-black px-2 py-1 rounded-md text-xs hover:bg-[#2ca44e]"
                  >
                    Seleccionar
                  </Button>
                </li>
              );
            })}
          </ul>
        </div>
      </Modal>
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
    const validRoutines = routines.filter((routine) => {
      const hasValidDays = routine.days.length > 0 && routine.days.every((day: Partial<IDay>) => {
        const exercises = day.exercises ?? [];
        return exercises.length > 0;
      });
      return hasValidDays;
    });
    const serializedRoutines = validRoutines.map((r) => ({
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
          circuitId: exercise.circuitId || "",
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