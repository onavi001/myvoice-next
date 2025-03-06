import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../store";
import { fetchRoutines, selectRoutine, updateExerciseCompleted } from "../store/routineSlice";
import { useRouter } from "next/router";
import { GetServerSideProps } from "next";
import {dbConnect} from "../lib/mongodb";
import RoutineModel from "../models/routines";

export default function RoutinePage({ initialRoutines }: { initialRoutines: any[] }) {
  const dispatch = useDispatch<AppDispatch>();
  const { routines, selectedRoutineIndex, loading, error } = useSelector((state: RootState) => state.routine);
  const { user } = useSelector((state: RootState) => state.user);
  const router = useRouter();

  useEffect(() => {
    if (!user) router.push("/");
    else dispatch(fetchRoutines(user._id));
  }, [user, ]);

  const handleToggleCompleted = (routineId: string, dayIndex: number, exerciseIndex: number, completed: boolean) => {
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

  if (loading) return <div className="min-h-screen bg-[#1A1A1A] text-white flex items-center justify-center">Cargando...</div>;
  if (error) return <div className="min-h-screen bg-[#1A1A1A] text-white flex items-center justify-center">Error: {error}</div>;

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-white flex flex-col">
      <div className="p-4 max-w-full mx-auto flex-1">
        <div className="flex overflow-x-auto space-x-2 mb-4 scrollbar-hidden">
          {routines.map((routine, index) => (
            <button
              key={routine._id}
              onClick={() => dispatch(selectRoutine(index))}
              className={`px-2 py-1 rounded-full text-xs font-medium transition-colors shadow-sm truncate max-w-[120px] ${
                selectedRoutineIndex === index ? "bg-white text-black" : "bg-[#2D2D2D] text-[#B0B0B0] hover:bg-[#4A4A4A]"
              }`}
            >
              {routine.name}
            </button>
          ))}
        </div>
        {selectedRoutineIndex !== null && (
          <>
            <div className="mb-4">
              <div className="text-[#B0B0B0] text-xs mb-1">Progreso Semanal: {Math.round(calculateWeekProgress(routines[selectedRoutineIndex]))}%</div>
              <div className="w-full bg-[#4A4A4A] rounded-full h-2.5">
                <div className="bg-[#34C759] h-2.5 rounded-full" style={{ width: `${calculateWeekProgress(routines[selectedRoutineIndex])}%` }}></div>
              </div>
            </div>
            <div className="flex overflow-x-auto space-x-2 mb-4 scrollbar-hidden">
              {routines[selectedRoutineIndex].days.map((day: any, dayIndex: number) => (
                <button key={dayIndex} className="px-2 py-1 rounded-full text-xs font-medium bg-[#2D2D2D] text-[#B0B0B0] hover:bg-[#4A4A4A]">
                  {day.dayName}
                </button>
              ))}
            </div>
            <div className="mb-4">
              <div className="text-[#B0B0B0] text-xs mb-1">Progreso Día: {Math.round(calculateDayProgress(routines[selectedRoutineIndex].days[0]))}%</div>
              <div className="w-full bg-[#4A4A4A] rounded-full h-2.5">
                <div className="bg-[#34C759] h-2.5 rounded-full" style={{ width: `${calculateDayProgress(routines[selectedRoutineIndex].days[0])}%` }}></div>
              </div>
            </div>
            <ul className="space-y-2">
              {routines[selectedRoutineIndex].days[0].exercises.map((exercise: any, exerciseIndex: number) => (
                <li key={exerciseIndex} className="bg-[#2D2D2D] rounded-lg shadow-sm p-2">
                  <label className="flex items-center">
                    <input
                      type="checkbox"
                      checked={exercise.completed}
                      onChange={(e) => handleToggleCompleted(routines[selectedRoutineIndex]._id, 0, exerciseIndex, e.target.checked)}
                      className="mr-2"
                    />
                    <span className="text-sm font-semibold text-white">{exercise.name}</span>
                  </label>
                </li>
              ))}
            </ul>
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
          </div>
        </div>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async () => {
  await dbConnect();
  const routines = await RoutineModel.find().lean();
  return { props: { initialRoutines: JSON.parse(JSON.stringify(routines)) } };
};