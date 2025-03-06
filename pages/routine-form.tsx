import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { RootState, AppDispatch } from "../store";
import { addRoutine } from "../store/routineSlice";
import { useRouter } from "next/router";
import { GetServerSideProps } from "next";
import jwt from "jsonwebtoken";

export default function RoutineFormPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { user, loading } = useSelector((state: RootState) => state.user);
  const router = useRouter();
  const [formData, setFormData] = useState({
    name: "",
    days: [{ dayName: "", exercises: [{ name: "", muscleGroup: "", sets: 0, reps: 0, weight: "", rest: "", tips: ["", ""], completed: false, videos: [{ url: "", isCurrent: false }] }], musclesWorked: [], warmupOptions: [], explanation: "" }],
  });

  useEffect(() => {
    if (!user && !loading) router.push("/");
  }, [user, router, loading]);

  const handleRoutineChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleDayChange = (dayIndex: number, field: string, value: string | string[]) => {
    const updatedDays = [...formData.days];
    updatedDays[dayIndex] = { ...updatedDays[dayIndex], [field]: value };
    setFormData({ ...formData, days: updatedDays });
  };

  const handleExerciseChange = (dayIndex: number, exerciseIndex: number, field: string, value: string | number | string[]) => {
    const updatedDays = [...formData.days];
    const updatedExercises = [...updatedDays[dayIndex].exercises];
    updatedExercises[exerciseIndex] = { ...updatedExercises[exerciseIndex], [field]: value };
    updatedDays[dayIndex].exercises = updatedExercises;
    setFormData({ ...formData, days: updatedDays });
  };

  const addDay = () => {
    setFormData({
      ...formData,
      days: [...formData.days, { dayName: "", exercises: [], musclesWorked: [], warmupOptions: [], explanation: "" }],
    });
  };

  const addExercise = (dayIndex: number) => {
    const updatedDays = [...formData.days];
    updatedDays[dayIndex].exercises.push({ name: "", muscleGroup: "", sets: 0, reps: 0, weight: "", rest: "", tips: ["", ""], completed: false, videos: [{ url: "", isCurrent: false }] });
    setFormData({ ...formData, days: updatedDays });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (user) {
      await dispatch(addRoutine({ ...formData, userId: user._id }));
      router.push("/routine");
    }
  };

  if (loading) return <div className="min-h-screen bg-[#1A1A1A] text-white flex items-center justify-center">Cargando...</div>;

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-white flex flex-col">
      <div className="p-4 max-w-md mx-auto flex-1">
        <h2 className="text-sm font-semibold mb-4">Agregar Rutina</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="name"
            placeholder="Nombre de la rutina"
            value={formData.name}
            onChange={handleRoutineChange}
            className="w-full p-2 border border-[#4A4A4A] rounded bg-[#1A1A1A] text-white text-xs placeholder-[#B0B0B0] focus:outline-none focus:ring-1 focus:ring-[#34C759]"
          />
          {formData.days.map((day, dayIndex) => (
            <div key={dayIndex} className="bg-[#2D2D2D] p-2 rounded-lg shadow-sm space-y-2">
              <input
                placeholder="Nombre del día"
                value={day.dayName}
                onChange={(e) => handleDayChange(dayIndex, "dayName", e.target.value)}
                className="w-full p-2 border border-[#4A4A4A] rounded bg-[#1A1A1A] text-white text-xs placeholder-[#B0B0B0] focus:outline-none focus:ring-1 focus:ring-[#34C759]"
              />
              {day.exercises.map((exercise, exerciseIndex) => (
                <div key={exerciseIndex} className="bg-[#4A4A4A] p-2 rounded-lg space-y-1">
                  <input
                    placeholder="Nombre del ejercicio"
                    value={exercise.name}
                    onChange={(e) => handleExerciseChange(dayIndex, exerciseIndex, "name", e.target.value)}
                    className="w-full p-1 border border-[#4A4A4A] rounded bg-[#1A1A1A] text-white text-xs placeholder-[#B0B0B0] focus:outline-none focus:ring-1 focus:ring-[#34C759]"
                  />
                  <input
                    type="number"
                    placeholder="Series"
                    value={exercise.sets || ""}
                    onChange={(e) => handleExerciseChange(dayIndex, exerciseIndex, "sets", Number(e.target.value))}
                    className="w-full p-1 border border-[#4A4A4A] rounded bg-[#1A1A1A] text-white text-xs placeholder-[#B0B0B0] focus:outline-none focus:ring-1 focus:ring-[#34C759]"
                  />
                  <input
                    type="number"
                    placeholder="Repeticiones"
                    value={exercise.reps || ""}
                    onChange={(e) => handleExerciseChange(dayIndex, exerciseIndex, "reps", Number(e.target.value))}
                    className="w-full p-1 border border-[#4A4A4A] rounded bg-[#1A1A1A] text-white text-xs placeholder-[#B0B0B0] focus:outline-none focus:ring-1 focus:ring-[#34C759]"
                  />
                  <input
                    placeholder="Peso"
                    value={exercise.weight}
                    onChange={(e) => handleExerciseChange(dayIndex, exerciseIndex, "weight", e.target.value)}
                    className="w-full p-1 border border-[#4A4A4A] rounded bg-[#1A1A1A] text-white text-xs placeholder-[#B0B0B0] focus:outline-none focus:ring-1 focus:ring-[#34C759]"
                  />
                </div>
              ))}
              <button
                type="button"
                onClick={() => addExercise(dayIndex)}
                className="w-full bg-[#34C759] text-black py-1 rounded hover:bg-[#2DBF4E] text-xs"
              >
                Agregar Ejercicio
              </button>
            </div>
          ))}
          <button
            type="button"
            onClick={addDay}
            className="w-full bg-[#34C759] text-black py-1 rounded hover:bg-[#2DBF4E] text-xs"
          >
            Agregar Día
          </button>
          <button
            type="submit"
            className="w-full bg-[#34C759] text-black py-2 rounded hover:bg-[#2DBF4E] text-xs"
          >
            Guardar Rutina
          </button>
        </form>
      </div>
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const token = context.req.cookies.token;
  if (!token) return { redirect: { destination: "/", permanent: false } };

  try {
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "my-super-secret-key") as { userId: string };
    return { props: {} };
  } catch (error) {
    return { redirect: { destination: "/", permanent: false } };
  }
};