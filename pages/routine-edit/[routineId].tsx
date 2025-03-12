import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import { GetServerSideProps } from "next";
import jwt from "jsonwebtoken";
import { dbConnect } from "../../lib/mongodb";
import { AppDispatch, RootState } from "../../store";
import { updateRoutine, updateDay, updateExercise } from "../../store/routineSlice";
import RoutineModel from "../../models/Routine";
import DayModel from "../../models/Day";
import ExerciseModel from "../../models/Exercise";
import VideoModel from "../../models/Video";
import { RoutineData } from "../../models/Routine";
import Button from "../../components/Button";
import Input from "../../components/Input";
import Card from "../../components/Card";

interface RoutineEditProps {
  routine: RoutineData;
}

export default function RoutineEditPage({ routine: initialRoutine }: RoutineEditProps) {
  const dispatch = useDispatch<AppDispatch>();
  const { routines, loading: reduxLoading } = useSelector((state: RootState) => state.routine);
  const router = useRouter();
  const [formData, setFormData] = useState<RoutineData>(initialRoutine);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [openDays, setOpenDays] = useState<boolean[]>(initialRoutine.days.map(() => true)); // Para menús colapsables

  useEffect(() => {
    const updatedRoutine = routines.find((r) => r._id === initialRoutine._id);
    if (updatedRoutine) {
      setFormData(updatedRoutine);
      setOpenDays(updatedRoutine.days.map(() => true)); // Resetear estado de colapsables
    }
  }, [routines, initialRoutine]);

  const handleInputChange = (
    field: keyof RoutineData | "dayName" | "name" | "sets" | "reps" | "weight",
    value: string | RoutineData["days"] | RoutineData["days"][number]["exercises"][number],
    dayIndex?: number,
    exerciseIndex?: number,
    exerciseField?: keyof RoutineData["days"][number]["exercises"][number]
  ) => {
    if (dayIndex !== undefined && exerciseIndex !== undefined && exerciseField) {
      const updatedDays = [...formData.days];
      updatedDays[dayIndex].exercises[exerciseIndex] = {
        ...updatedDays[dayIndex].exercises[exerciseIndex],
        [exerciseField]: value,
      };
      setFormData({ ...formData, days: updatedDays });
    } else if (dayIndex !== undefined) {
      const updatedDays = [...formData.days];
      updatedDays[dayIndex] = { ...updatedDays[dayIndex], [field]: value };
      setFormData({ ...formData, days: updatedDays });
    } else {
      setFormData({ ...formData, [field]: value });
    }
  };

  const toggleDay = (dayIndex: number) => {
    setOpenDays((prev) => {
      const newOpenDays = [...prev];
      newOpenDays[dayIndex] = !newOpenDays[dayIndex];
      return newOpenDays;
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      await dispatch(updateRoutine({ routineId: formData._id, name: formData.name })).unwrap();

      for (const day of formData.days) {
        await dispatch(
          updateDay({
            routineId: formData._id,
            dayId: day._id,
            dayName: day.dayName,
          })
        ).unwrap();

        for (const exercise of day.exercises) {
          await dispatch(
            updateExercise({
              routineId: formData._id,
              dayId: day._id,
              exerciseId: exercise._id,
              exerciseData: {
                name: exercise.name,
                sets: exercise.sets,
                reps: exercise.reps,
                weight: exercise.weight,
              },
            })
          ).unwrap();
        }
      }

      router.push("/routine");
    } catch (err) {
      setError("Error al actualizar la rutina");
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  if (loading || reduxLoading) return <div className="min-h-screen bg-[#1A1A1A] text-white flex items-center justify-center">Cargando...</div>;
  if (error) return <div className="min-h-screen bg-[#1A1A1A] text-white flex items-center justify-center">Error: {error}</div>;

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-white flex flex-col">
      <div className="p-4 max-w-md mx-auto flex-1">
        <h1 className="text-lg font-bold mb-3 text-white">Editar Rutina</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-[#D1D1D1] text-xs font-medium mb-1">Nombre</label>
            <Input
              name="name"
              value={formData.name}
              onChange={(e) => handleInputChange("name", e.target.value)}
              className="w-full bg-[#2D2D2D] border border-[#4A4A4A] text-white placeholder-[#B0B0B0] rounded-md p-2 text-xs focus:ring-1 focus:ring-[#34C759] focus:border-transparent"
            />
          </div>

          {/* Días */}
          {formData.days.map((day, dayIndex) => (
            <Card
              key={day._id}
              className="p-2 bg-[#252525] border-2 border-[#4A4A4A] rounded-md mb-2"
            >
              <div
                className="flex justify-between items-center cursor-pointer py-1 bg-[#2D2D2D] px-2 rounded-t-md"
                onClick={() => toggleDay(dayIndex)}
              >
                <h2 className="text-sm font-bold text-[#34C759]">
                  {day.dayName || `Día ${dayIndex + 1}`}
                </h2>
                <span className="text-[#D1D1D1] text-xs">{openDays[dayIndex] ? "▲" : "▼"}</span>
              </div>
              {openDays[dayIndex] && (
                <div className="mt-1 space-y-2">
                  <div>
                    <label className="block text-[#D1D1D1] text-xs font-medium mb-1">Día</label>
                    <Input
                      name="dayName"
                      value={day.dayName}
                      onChange={(e) => handleInputChange("dayName", e.target.value, dayIndex)}
                      className="bg-[#2D2D2D] border border-[#4A4A4A] text-white placeholder-[#B0B0B0] rounded-md p-2 text-xs w-full focus:ring-1 focus:ring-[#34C759] focus:border-transparent"
                    />
                  </div>
                  {day.exercises.map((exercise, exerciseIndex) => (
                    <div
                      key={exercise._id}
                      className="ml-2 space-y-1 border-t border-[#3A3A3A] pt-2"
                    >
                      <label className="block text-[#D1D1D1] text-xs font-semibold">
                        Ejercicio {exerciseIndex + 1}
                      </label>
                      <Input
                        name="name"
                        value={exercise.name}
                        onChange={(e) =>
                          handleInputChange("name", e.target.value, dayIndex, exerciseIndex, "name")
                        }
                        className="bg-[#2D2D2D] border border-[#4A4A4A] text-white placeholder-[#B0B0B0] rounded-md p-2 text-xs w-full focus:ring-1 focus:ring-[#34C759] focus:border-transparent"
                      />
                      <div className="flex space-x-2">
                        <div className="w-1/2">
                          <Input
                            name="sets"
                            type="number"
                            value={exercise.sets}
                            onChange={(e) =>
                              handleInputChange("sets", e.target.value, dayIndex, exerciseIndex, "sets")
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
                              handleInputChange("reps", e.target.value, dayIndex, exerciseIndex, "reps")
                            }
                            placeholder="Reps"
                            className="bg-[#2D2D2D] border border-[#4A4A4A] text-white placeholder-[#B0B0B0] rounded-md p-2 text-xs w-full focus:ring-1 focus:ring-[#34C759] focus:border-transparent"
                          />
                        </div>
                      </div>
                      <Input
                        name="weight"
                        value={exercise.weight || ""}
                        onChange={(e) =>
                          handleInputChange("weight", e.target.value, dayIndex, exerciseIndex, "weight")
                        }
                        placeholder="Peso"
                        className="bg-[#2D2D2D] border border-[#4A4A4A] text-white placeholder-[#B0B0B0] rounded-md p-2 text-xs w-full focus:ring-1 focus:ring-[#34C759] focus:border-transparent"
                      />
                      <Button
                        variant="secondary"
                        type="button"
                        onClick={(e: React.MouseEvent<HTMLButtonElement, MouseEvent>) => {
                          e.preventDefault();
                          const url = `/routine-edit/${formData._id}/exercise-videos?dayIndex=${dayIndex}&exerciseIndex=${exerciseIndex}`;
                          router.push(url);
                        }}
                        className="mt-2 w-full bg-[#FFD54F] text-black hover:bg-[#FFCA28] rounded-md py-1 px-2 text-xs font-semibold border border-[#FFCA28] shadow-md"
                      >
                        Editar Videos
                      </Button>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          ))}

          <div className="flex space-x-2">
            <Button
              type="submit"
              disabled={loading}
              className="w-1/2 bg-[#66BB6A] text-black hover:bg-[#4CAF50] rounded-md py-1 px-2 text-xs font-semibold border border-[#4CAF50] shadow-md disabled:bg-[#4CAF50] disabled:opacity-50"
            >
              {loading ? "Guardando..." : "Guardar"}
            </Button>
            <Button
              type="button"
              onClick={() => router.push("/routine")}
              className="w-1/2 bg-[#EF5350] text-white hover:bg-[#D32F2F] rounded-md py-1 px-2 text-xs font-semibold border border-[#D32F2F] shadow-md"
            >
              Cancelar
            </Button>
          </div>

          {error && <p className="text-red-500 text-xs font-medium">{error}</p>}
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
      days: routine.days.map((day: any) => ({
        _id: day._id.toString(),
        dayName: day.dayName,
        musclesWorked: day.musclesWorked || [],
        warmupOptions: day.warmupOptions || [],
        explanation: day.explanation || "",
        exercises: day.exercises.map((exercise: any) => ({
          _id: exercise._id.toString(),
          name: exercise.name,
          muscleGroup: exercise.muscleGroup || "",
          sets: exercise.sets || 0,
          reps: exercise.reps || 0,
          weight: exercise.weight || "",
          rest: exercise.rest || "",
          tips: exercise.tips || [],
          completed: exercise.completed || false,
          videos: exercise.videos.map((video: any) => ({
            _id: video._id.toString(),
            url: video.url,
            isCurrent: video.isCurrent,
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