import React, { useState } from "react";
import { useRouter } from "next/router";
import { useDispatch } from "react-redux";
import { GetServerSideProps } from "next";
import jwt from "jsonwebtoken";
import { dbConnect } from "../../lib/mongodb";
import { AppDispatch } from "../../store";
import { updateRoutine, deleteRoutine } from "../../store/routineSlice";
import RoutineModel from "../../models/Routine";
import DayModel, { IDay } from "../../models/Day";
import ExerciseModel, { IExercise } from "../../models/Exercise";
import VideoModel, { IVideo } from "../../models/Video";
import { RoutineData } from "../../models/Routine";
import Button from "../../components/Button";
import Input from "../../components/Input";
import Card from "../../components/Card";

interface ExerciseFormData extends IExercise {
  isOpen: boolean;
}
interface DayFormData extends IDay {
  isOpen: boolean;
  exercises: ExerciseFormData[];
}
interface RoutineEditProps {
  routine: RoutineData;
}

export default function RoutineEditPage({ routine: initialRoutine }: RoutineEditProps) {
  const dispatch = useDispatch<AppDispatch>();
  
  const router = useRouter();
  const [routineName, setRoutineName] = useState(initialRoutine.name);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [days, setDays] = useState<DayFormData[]>(
      initialRoutine.days.map(day => ({
        ...day,
        isOpen: false,
        exercises: day.exercises.map(exercise => ({
          ...exercise,
          isOpen: false
        }))
      })) as unknown as DayFormData[]
    );

    const handleAddDay = () => {
      setDays([...days, {
        dayName: "",
        musclesWorked: [],
        warmupOptions: [],
        explanation: "",
        exercises: [
          {
            isOpen: true,
            name: "",
            sets: 0,
            reps: 0,
            muscleGroup: [],
            repsUnit: "count",
            weightUnit: "kg",
            weight: "",
            tips: [],
            videos: [],
            completed: false,
            rest: "",
          } as unknown as ExerciseFormData,
        ],
        isOpen: true,
      } as unknown as DayFormData]);
    };
  
    const handleAddExercise = (dayIndex: number) => {
      const updatedDays: DayFormData[] = [...days];
      updatedDays[dayIndex].exercises = updatedDays[dayIndex].exercises || [];
      updatedDays[dayIndex].exercises.push({
        isOpen: true,
        name: "",
        sets: 0,
        reps: 0,
        muscleGroup: [],
        repsUnit: "count",
        weightUnit: "kg",
        weight: "",
        tips: [],
        videos: [],
        completed: false,
        rest: "",
      } as unknown as ExerciseFormData,);
      setDays(updatedDays);
    };
  
    const handleDeleteExercise = (dayIndex: number, exerciseIndex: number) => {
      const updatedDays: DayFormData[] = [...days];
      updatedDays[dayIndex].exercises = updatedDays[dayIndex].exercises.filter( (_,index) => exerciseIndex !== index);
      setDays(updatedDays);
    }
    const handleDeleteDay = (dayIndex: number) => {
      let updatedDays: DayFormData[] = [...days];
      updatedDays = updatedDays.filter((_,index) => dayIndex !== index);
      setDays(updatedDays);
    }
  
    const handleDayChange = (dayIndex: number, field: string, value: string) => {
      const updatedDays = [...days];
      if (field === "musclesWorked" || field === "warmupOptions") {
        updatedDays[dayIndex] = { ...updatedDays[dayIndex], [field]: value.split(",") };
      }else{
        updatedDays[dayIndex] = { ...updatedDays[dayIndex], [field]: value };
      }
      setDays(updatedDays);
    };
  
    const handleExerciseChange = (dayIndex: number, exerciseIndex: number, field: string, value: string | number) => {
      const updatedDays = [...days];
      if (typeof value === "string" && (field === "muscleGroup" || field === "tips")) {
        updatedDays[dayIndex].exercises[exerciseIndex] = {
          ...updatedDays[dayIndex].exercises[exerciseIndex],
          [field]: value.split(","),
        };
      }else{
        updatedDays[dayIndex].exercises[exerciseIndex] = {
          ...updatedDays[dayIndex].exercises[exerciseIndex],
          [field]: typeof value === "number" ? value : value,
        };
      }
      setDays(updatedDays);
    };
  
    const toggleDay = (dayIndex: number) => {
      const updatedDays = [...days];
      updatedDays[dayIndex].isOpen = !updatedDays[dayIndex].isOpen;
      setDays(updatedDays);
    };
  
    const toggleExercises = (dayIndex: number, exerciseIndex:number) => {
      const updatedDays = [...days];
      updatedDays[dayIndex].exercises[exerciseIndex].isOpen = !updatedDays[dayIndex].exercises[exerciseIndex].isOpen;
      setDays(updatedDays);
    };
  
    const handleSubmit = async (e: React.FormEvent) => {
      e.preventDefault();
      if (!routineName || days.some((day) => !day.dayName || day.exercises.some((ex:Partial<IExercise>) => !ex.name))) {
        setError("Todos los campos obligatorios deben estar completos");
        return;
      }
  
      setLoading(true);
      setError(null);
  
      try {
        await dispatch(updateRoutine({ name: routineName, _id: initialRoutine._id,days: days } as unknown as RoutineData)).unwrap();
        router.push("/routine");
      } catch (err) {
        setError("Error al crear la rutina");
        console.error(err);
      } finally {
        setLoading(false);
      }
    };
  
    const handleDelete = async () => {
      setLoading(true);
      setError(null);
      try {
        await dispatch(deleteRoutine(initialRoutine._id)).unwrap();
        router.push("/routine");
      } catch {
        setError("Error al eliminar la rutina");
      } finally{
        setLoading(false);
      }
    }
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
                      <Input
                        name="musclesWorked"
                        value={day.musclesWorked.join(", ")}
                        onChange={(e) => handleDayChange(dayIndex, "musclesWorked", e.target.value)}
                        placeholder="Musculos trabajados (separados por comas)"
                        className="mt-2 bg-[#2D2D2D] border border-[#4A4A4A] text-white placeholder-[#B0B0B0] rounded-md p-2 text-xs w-full focus:ring-1 focus:ring-[#34C759] focus:border-transparent"
                      />
                      <Input
                        name="warmupOptions"
                        value={day.warmupOptions.join(", ")}
                        onChange={(e) => handleDayChange(dayIndex, "warmupOptions", e.target.value)}
                        placeholder="Calentamientos (Separados por comas)"
                        className="mt-2 bg-[#2D2D2D] border border-[#4A4A4A] text-white placeholder-[#B0B0B0] rounded-md p-2 text-xs w-full focus:ring-1 focus:ring-[#34C759] focus:border-transparent"
                      />
                      <Input
                        name="explanation"
                        value={day.explanation}
                        onChange={(e) => handleDayChange(dayIndex, "explanation", e.target.value)}
                        placeholder="Explicación"
                        className="mt-2 bg-[#2D2D2D] border border-[#4A4A4A] text-white placeholder-[#B0B0B0] rounded-md p-2 text-xs w-full focus:ring-1 focus:ring-[#34C759] focus:border-transparent"
                      />
                    </div>
                    {day.exercises.map((exercise, exerciseIndex) => (
                      <Card
                        key={exerciseIndex}
                        className="p-2 bg-[#252525] border-2 border-[#4A4A4A] rounded-md mb-2"
                      >
                        {/**toggle excersice */}
                        <div
                          className="flex justify-between items-center cursor-pointer py-1 bg-[#2D2D2D] px-2 rounded-t-md"
                          onClick={() => toggleExercises(dayIndex,exerciseIndex)}
                        >
                          <h2 className="text-sm font-bold text-[#34C759]">
                            {exercise.name || `Ejercicio ${exerciseIndex + 1}`}
                          </h2>
                          <span className="text-[#D1D1D1] text-xs">{exercise.isOpen ? "▲" : "▼"}</span>
                        </div>
                        {exercise.isOpen &&(
                          <>
                            <Input
                              name="name"
                              value={exercise.name}
                              onChange={(e) => handleExerciseChange(dayIndex, exerciseIndex, "name", e.target.value)}
                              placeholder="Press de banca"
                              className="mt-2 bg-[#2D2D2D] border border-[#4A4A4A] text-white placeholder-[#B0B0B0] rounded-md p-2 text-xs w-full focus:ring-1 focus:ring-[#34C759] focus:border-transparent"
                            />
                            <Input
                              name="muscleGroup"
                              value={exercise.muscleGroup.join(", ")}
                              onChange={(e) => handleExerciseChange(dayIndex, exerciseIndex, "muscleGroup", e.target.value)}
                              placeholder="Musculos trabajados (separados por comas)"
                              className="mt-2 bg-[#2D2D2D] border border-[#4A4A4A] text-white placeholder-[#B0B0B0] rounded-md p-2 text-xs w-full focus:ring-1 focus:ring-[#34C759] focus:border-transparent"
                            />
                            <Input
                              name="tips"
                              value={exercise.tips.join(", ")}
                              onChange={(e) => handleExerciseChange(dayIndex, exerciseIndex, "tips", e.target.value)}
                              placeholder="Consejos (separados por comas)"
                              className="mt-2 bg-[#2D2D2D] border border-[#4A4A4A] text-white placeholder-[#B0B0B0] rounded-md p-2 text-xs w-full focus:ring-1 focus:ring-[#34C759] focus:border-transparent"
                            />
                            <div className="mt-4 flex space-x-2">
                              <div className="w-1/3">
                                <label className="block text-[#D1D1D1] text-xs font-semibold">Series</label>
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
                              <div className="w-1/3">
                                <label className="block text-[#D1D1D1] text-xs font-semibold">Repeticiones</label>
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
                              <div className="w-1/3">
                                <label className="block text-[#D1D1D1] text-xs font-semibold">Descanso</label>
                                <Input
                                  name="rest"
                                  type="number"
                                  value={exercise.rest}
                                  onChange={(e) =>
                                    handleExerciseChange(dayIndex, exerciseIndex, "rest", Number(e.target.value))
                                  }
                                  placeholder="Descanso"
                                  className="bg-[#2D2D2D] border border-[#4A4A4A] text-white placeholder-[#B0B0B0] rounded-md p-2 text-xs w-full focus:ring-1 focus:ring-[#34C759] focus:border-transparent"
                                />
                              </div>
                            </div>
                            <Button
                              type="button"
                              disabled={day.exercises.length >= 2 ? false : true}
                              onClick={() => {handleDeleteExercise(dayIndex,exerciseIndex)}}
                              className="mt-4 w-1/2 bg-[#EF5350] text-white hover:bg-[#D32F2F] rounded-md py-1 px-2 text-xs font-semibold border border-[#D32F2F] shadow-md disabled:bg-[#D32F2F] disabled:opacity-50"
                            >
                              Eliminar ejercicio
                            </Button>
                          </>
                        )}
                      </Card>
                    ))}
                    <div className="flex space-x-2">
                      <Button
                        type="button"
                        onClick={() => {handleDeleteDay(dayIndex)}}
                        className="mt-2 w-1/2 bg-[#EF5350] text-white hover:bg-[#D32F2F] rounded-md py-1 px-2 text-xs font-semibold border border-[#D32F2F] shadow-md disabled:bg-[#4CAF50] disabled:opacity-50"
                      >
                        Eliminar Dia
                      </Button>
                      <Button
                        variant="secondary"
                        type="button"
                        onClick={() => handleAddExercise(dayIndex)}
                        className="mt-2 w-full bg-[#66BB6A] text-black hover:bg-[#4CAF50] rounded-md py-1 px-2 text-xs font-semibold border border-[#4CAF50] shadow-md"
                      >
                        + Ejercicio
                      </Button>
                    </div>
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
                {loading ? "Guardabdo..." : "Guardar"}
              </Button>
              <Button
                type="button"
                onClick={handleDelete}
                className="w-1/2 bg-[#EF5350] text-white hover:bg-[#D32F2F] rounded-md py-1 px-2 text-xs font-semibold border border-[#D32F2F] shadow-md disabled:bg-[#4CAF50] disabled:opacity-50"
              >
                Eliminar rutina
              </Button>
            </div>
          </form>
        </div>
      </div>
    );
}

export const getServerSideProps: GetServerSideProps<RoutineEditProps> = async (context) => {
  const { routineId } = context.params as { routineId: string };
  const token = context.req.cookies.token;
  if (!token) {
    return { redirect: { destination: "/", permanent: false } };
  }

  try {
    await dbConnect();
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "my-super-secret-key") as { userId: string };

    const routine = await RoutineModel.findOne({ _id: routineId, userId: decoded.userId })
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

    if (!routine) {
      return { notFound: true };
    }

    const serializedRoutine: RoutineData = {
      _id: routine._id.toString(),
      userId: routine.userId.toString(),
      name: routine.name,
      days: routine.days.map((day: Partial<IDay>) => ({
        _id: day._id?.toString() || "",
        dayName: day.dayName || "",
        musclesWorked: day.musclesWorked || [],
        warmupOptions: day.warmupOptions || [],
        explanation: day.explanation || "",
        exercises: (day.exercises ?? []).map((exercise: Partial<IExercise>) => ({
          _id: exercise._id?.toString() || "",
          name: exercise.name || "",
          muscleGroup: exercise.muscleGroup || [],
          sets: exercise.sets || 0,
          reps: exercise.reps || 0,
          repsUnit: exercise.repsUnit || "count",
          weight: exercise.weight || "",
          weightUnit: exercise.weightUnit || "kg",
          rest: exercise.rest || "",
          tips: exercise.tips || [],
          completed: exercise.completed || false,
          videos: (exercise.videos ?? []).map((video: Partial<IVideo>) => ({
            _id: video._id?.toString() || "",
            url: video.url || "",
            isCurrent: video.isCurrent || false,
          })),
          notes: exercise.notes || "",
        })),
      })),
      createdAt: routine.createdAt ? new Date(routine.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: routine.updatedAt ? new Date(routine.updatedAt).toISOString() : new Date().toISOString(),
    };

    return { props: { routine: serializedRoutine } };
  } catch (error) {
    console.error("Error en getServerSideProps:", error);
    return { redirect: { destination: "/routine", permanent: false } };
  }
};