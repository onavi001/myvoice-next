import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../store";
import { fetchRoutines, selectRoutine, updateExerciseCompleted, logout } from "../store/routineSlice";
import { useRouter } from "next/router";
import { GetServerSideProps } from "next";
import jwt from "jsonwebtoken";
import Routine from "../models/routines";
import {dbConnect} from "../lib/mongodb";

export default function RoutinePage({ initialRoutines }: { initialRoutines: any[] }) {
  const dispatch = useDispatch<AppDispatch>();
  const { routines, selectedRoutineIndex, loading, error } = useSelector((state: RootState) => state.routine);
  const { user, loading: userLoading } = useSelector((state: RootState) => state.user);
  const router = useRouter();
  const [selectedDayIndex, setSelectedDayIndex] = useState(0);
  const [expandedExercises, setExpandedExercises] = useState<Record<number, boolean>>({});

  useEffect(() => {
    console.log("User:", user, "User Loading:", userLoading, "Routines:", routines);
    if (!user && !userLoading) {
      console.log("No user, redirecting to /");
      router.push("/");
    } else if (user && routines.length === 0) {
      console.log("Fetching routines for user");
      dispatch(fetchRoutines());
    }
  }, [dispatch, user, userLoading, router]);

  const handleToggleCompleted = (routineId: string, dayIndex: number, exerciseIndex: number, completed: boolean) => {
    console.log("Toggling completed:", { routineId, dayIndex, exerciseIndex, completed });
    dispatch(updateExerciseCompleted({ routineId, dayIndex, exerciseIndex, completed }));
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

  const toggleExerciseExpand = (exerciseIndex: number) => {
    setExpandedExercises((prev) => ({
      ...prev,
      [exerciseIndex]: !prev[exerciseIndex],
    }));
  };

  if (userLoading || loading) return <div className="min-h-screen bg-[#1A1A1A] text-white flex items-center justify-center">Cargando...</div>;
  if (error) return <div className="min-h-screen bg-[#1A1A1A] text-white flex items-center justify-center">Error: {error}</div>;
  if (!user) return null;

  const selectedRoutine = selectedRoutineIndex !== null ? routines[selectedRoutineIndex] : null;
  const selectedDay = selectedRoutine ? selectedRoutine.days[selectedDayIndex] : null;

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-white flex flex-col">
      <div className="p-4 max-w-full mx-auto flex-1">
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
        {selectedRoutine && (
          <>
            <div className="mb-4">
              <div className="text-[#B0B0B0] text-xs mb-1">Progreso Semanal: {Math.round(calculateWeekProgress(selectedRoutine))}%</div>
              <div className="w-full bg-[#4A4A4A] rounded-full h-2.5">
                <div className="bg-[#34C759] h-2.5 rounded-full" style={{ width: `${calculateWeekProgress(selectedRoutine)}%` }}></div>
              </div>
            </div>
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
            {selectedDay && (
              <>
                <div className="mb-4">
                  <div className="text-[#B0B0B0] text-xs mb-1">Progreso Día: {Math.round(calculateDayProgress(selectedDay))}%</div>
                  <div className="w-full bg-[#4A4A4A] rounded-full h-2.5">
                    <div className="bg-[#34C759] h-2.5 rounded-full" style={{ width: `${calculateDayProgress(selectedDay)}%` }}></div>
                  </div>
                </div>
                <ul className="space-y-2">
                  {selectedDay.exercises.map((exercise: any, exerciseIndex: number) => {
                    const isExpanded = expandedExercises[exerciseIndex] || false;
                    return (
                      <li key={exerciseIndex} className="bg-[#2D2D2D] rounded-lg shadow-sm overflow-hidden">
                        <button
                          onClick={() => toggleExerciseExpand(exerciseIndex)}
                          className="w-full flex justify-between items-center p-2 text-left hover:bg-[#4A4A4A] transition-colors"
                        >
                          <div className="flex items-center">
                            <input
                              type="checkbox"
                              checked={exercise.completed}
                              onChange={(e) => handleToggleCompleted(selectedRoutine._id, selectedDayIndex, exerciseIndex, e.target.checked)}
                              onClick={(e) => e.stopPropagation()}
                              className="mr-2"
                            />
                            <span className="text-sm font-semibold text-white truncate">{exercise.name}</span>
                          </div>
                          <span className="text-[#B0B0B0] text-xs">{isExpanded ? "▲" : "▼"}</span>
                        </button>
                        {isExpanded && (
                          <div className="p-2 bg-[#4A4A4A] text-xs space-y-2">
                            <p><span className="text-[#B0B0B0] font-semibold">Músculo:</span> {exercise.muscleGroup}</p>
                            <p><span className="text-[#B0B0B0] font-semibold">Series:</span> {exercise.sets}, <span className="text-[#B0B0B0] font-semibold">Reps:</span> {exercise.reps}</p>
                            {exercise.videos && exercise.videos.length > 0 && (
                              <iframe
                                src={exercise.videos.find((v: any) => v.isCurrent)?.url || exercise.videos[0].url}
                                title={`Demostración de ${exercise.name}`}
                                className="w-full h-32 rounded border border-[#4A4A4A]"
                                frameBorder="0"
                                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                                allowFullScreen
                              />
                            )}
                          </div>
                        )}
                      </li>
                    );
                  })}
                </ul>
              </>
            )}
          </>
        )}
        <div className="fixed bottom-0 left-0 right-0 bg-[#1A1A1A] p-1 shadow-sm border-t border-[#4A4A4A]">
          <div className="max-w-md mx-auto flex space-x-2">
            <button onClick={() => router.push("/routine-form")} className="w-full bg-[#34C759] text-black py-1 rounded hover:bg-[#2DBF4E] text-xs">
              Nueva Rutina
            </button>
            <button onClick={() => router.push("/progress")} className="w-full bg-white text-black py-1 rounded hover:bg-[#E0E0E0] text-xs">
              Progreso
            </button>
            <button onClick={() => dispatch(logout())} className="w-full bg-red-500 text-white py-1 rounded hover:bg-red-600 text-xs">
              Cerrar Sesión
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const token = context.req.cookies.token;
  if (!token) {
    console.log("No token found, redirecting to /");
    return { redirect: { destination: "/", permanent: false } };
  }

  try {
    await dbConnect();
    const Routine = (await import("../models/routines")).default;
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "my-super-secret-key") as { userId: string };
    const routines = await Routine.find({ userId: decoded.userId }).lean();
    console.log("Routines fetched:", routines);
    return { props: { initialRoutines: JSON.parse(JSON.stringify(routines)) } };
  } catch (error) {
    console.error("Error in getServerSideProps:", error);
    return { redirect: { destination: "/", permanent: false } };
  }
};