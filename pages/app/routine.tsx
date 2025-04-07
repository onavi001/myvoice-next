import React, { useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../../store";
import { useRouter } from "next/router";
import RoutineSelector from "../../components/routine/RoutineSelector";
import DayProgress from "../../components/routine/DayProgress";
import ExerciseList from "../../components/routine/ExerciseList";
import GenerateExerciseModal from "../../components/routine/GenerateExerciseModal";
import useRoutineData from "../../hooks/useRoutineData";
import useExerciseActions from "../../hooks/useExerciseActions";
import Loader, { FuturisticLoader } from "../../components/Loader";
import { RoutineData } from "../../models/Routine";
import { GetServerSideProps } from "next";
import jwt from "jsonwebtoken";
import { dbConnect } from "../../lib/mongodb";
import RoutineModel from "../../models/Routine";
import DayModel, { IDay } from "../../models/Day";
import ExerciseModel, { IExercise } from "../../models/Exercise";
import VideoModel, { IVideo } from "../../models/Video";
import Button from "../../components/Button";
import { ThunkError } from "../../store/routineSlice";

export default function RoutinePage({ initialRoutines }: { initialRoutines: RoutineData[] }) {
  const { loading, error, selectedRoutine, selectedDay, selectedDayIndex, setSelectedDay, setSelectedDayIndex } =
    useRoutineData(initialRoutines);
  const { loading: userLoading } = useSelector((state: RootState) => state.user);
  const { handleNewExercise, handleSelectExercise } = useExerciseActions();
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [generatedExercises, setGeneratedExercises] = useState<Partial<IExercise & { videoUrl: string }>[]>([]);
  const [loadingGenerate, setLoadingGenerate] = useState(false);
  const router = useRouter();

  const onGenerateExercise = async (dayIndex: number, exerciseIndex: number) => {
    setLoadingGenerate(true);
    try {
      const exercises = await handleNewExercise(dayIndex, exerciseIndex);
      if (exercises) {
        setGeneratedExercises(exercises);
        setIsModalOpen(true);
      } 
    } catch (err) {
      const error = err as ThunkError;
      if (error.message === "Unauthorized" && error.status === 401) router.push("/login");
      throw err;
    }finally{
      setLoadingGenerate(false);
    }
  };

  if (error) return <div className="min-h-screen bg-[#1A1A1A] text-white flex items-center justify-center">Error: {error}</div>;
  
  if (!selectedRoutine || !selectedDay) {
    return (
      <div className="min-h-screen bg-[#1A1A1A] text-white flex flex-col">
        <div className="p-4 max-w-md mx-auto mt-16">
          <h2 className="text-sm font-semibold text-white mb-3 truncate">Tu Rutina</h2>
          <p className="text-[#B0B0B0] text-xs">No hay rutinas generadas. Genera una desde la página principal.</p>
          <Button onClick={() => router.push("/app/routine-AI")} className="mt-3">
            Generar Rutina con IA
          </Button>
          <Button onClick={() => router.push("/app/routine-form")} className="mt-3">
            Agregar Rutina Manual
          </Button>
          <Button onClick={() => router.push("/app")} className="mt-3">
            Volver
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-white flex flex-col">
      {loadingGenerate && <FuturisticLoader />}
      {userLoading || loading && <Loader />}
      <div className="p-4 max-w-full mx-auto flex-1">
        <RoutineSelector selectedDayIndex={selectedDayIndex} setSelectedDayIndex={setSelectedDayIndex} setSelectedDay={setSelectedDay} />
        <DayProgress routine={selectedRoutine} day={selectedDay} />
        <ExerciseList
          dayIndex={selectedRoutine.days.findIndex((d) => d._id === selectedDay._id)}
          day={selectedDay}
          routineId={selectedRoutine._id.toString()}
          onGenerateExercise={onGenerateExercise}
        />
      </div>
      <GenerateExerciseModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        exercises={generatedExercises}
        onSelect={handleSelectExercise}
      />
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