import { useEffect, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../store";
import { fetchProgress, addProgressEntry } from "../store/progressSlice";
import { useRouter } from "next/router";
import { GetServerSideProps } from "next";
import jwt from "jsonwebtoken";
import {dbConnect} from "../lib/mongodb";
import Progress from "../models/progress";

export default function ProgressPage({ initialProgress }: { initialProgress: any[] }) {
  const dispatch = useDispatch<AppDispatch>();
  const { progress, loading, error } = useSelector((state: RootState) => state.progress);
  const { user, loading: userLoading } = useSelector((state: RootState) => state.user);
  const { routines } = useSelector((state: RootState) => state.routine);
  const router = useRouter();
  const [newProgress, setNewProgress] = useState({
    routineId: "",
    dayId: "0",
    exerciseId: "0",
    sets: 0,
    reps: 0,
    weight: "",
    notes: "",
  });

  useEffect(() => {
    console.log("User:", user, "User Loading:", userLoading, "Progress:", progress);
    if (!user && !userLoading) {
      console.log("No user, redirecting to /");
      router.push("/");
    } else if (user && progress.length === 0) {
      console.log("Fetching progress for user");
      dispatch(fetchProgress());
      if (routines.length > 0 && !newProgress.routineId) {
        setNewProgress((prev) => ({ ...prev, routineId: routines[0]._id }));
      }
    }
  }, [dispatch, user, userLoading, router]);

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setNewProgress((prev) => ({ ...prev, [name]: name === "sets" || name === "reps" ? Number(value) : value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (user) {
      console.log("Adding progress:", newProgress);
      dispatch(addProgressEntry({ ...newProgress, userId: user._id }));
      setNewProgress({
        routineId: routines.length > 0 ? routines[0]._id : "",
        dayId: "0",
        exerciseId: "0",
        sets: 0,
        reps: 0,
        weight: "",
        notes: "",
      });
    }
  };

  if (userLoading || loading) return <div className="min-h-screen bg-[#1A1A1A] text-white flex items-center justify-center">Cargando...</div>;
  if (error) return <div className="min-h-screen bg-[#1A1A1A] text-white flex items-center justify-center">Error: {error}</div>;
  if (!user) return null;

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-white flex flex-col">
      <div className="p-4 max-w-md mx-auto flex-1">
        <h1 className="text-xl font-semibold mb-4">Progreso</h1>
        <form onSubmit={handleSubmit} className="bg-[#2D2D2D] p-4 rounded-lg shadow-sm mb-4 space-y-2">
          <input
            name="sets"
            type="number"
            placeholder="Series"
            value={newProgress.sets}
            onChange={handleInputChange}
            className="w-full p-2 bg-[#1A1A1A] border border-[#4A4A4A] rounded text-white text-xs placeholder-[#B0B0B0] focus:outline-none focus:ring-1 focus:ring-[#34C759]"
          />
          <input
            name="reps"
            type="number"
            placeholder="Repeticiones"
            value={newProgress.reps}
            onChange={handleInputChange}
            className="w-full p-2 bg-[#1A1A1A] border border-[#4A4A4A] rounded text-white text-xs placeholder-[#B0B0B0] focus:outline-none focus:ring-1 focus:ring-[#34C759]"
          />
          <input
            name="weight"
            placeholder="Peso"
            value={newProgress.weight}
            onChange={handleInputChange}
            className="w-full p-2 bg-[#1A1A1A] border border-[#4A4A4A] rounded text-white text-xs placeholder-[#B0B0B0] focus:outline-none focus:ring-1 focus:ring-[#34C759]"
          />
          <textarea
            name="notes"
            placeholder="Notas"
            value={newProgress.notes}
            onChange={handleInputChange}
            className="w-full p-2 bg-[#1A1A1A] border border-[#4A4A4A] rounded text-white text-xs placeholder-[#B0B0B0] focus:outline-none focus:ring-1 focus:ring-[#34C759]"
          />
          <button
            type="submit"
            className="w-full bg-[#34C759] text-black py-2 rounded hover:bg-[#2DBF4E] text-xs"
          >
            Agregar Progreso
          </button>
        </form>
        <ul className="space-y-2">
          {progress.map((entry) => (
            <li key={entry._id} className="bg-[#2D2D2D] rounded-lg shadow-sm p-2">
              <p className="text-sm">Ejercicio: {entry.exerciseId}</p>
              <p className="text-xs text-[#B0B0B0]">Series: {entry.sets}, Reps: {entry.reps}, Peso: {entry.weight}</p>
              <p className="text-xs text-[#B0B0B0]">Notas: {entry.notes}</p>
              <p className="text-xs text-[#B0B0B0]">Fecha: {new Date(entry.date).toLocaleDateString()}</p>
            </li>
          ))}
        </ul>
        <button
          onClick={() => router.push("/routine")}
          className="fixed bottom-4 left-4 bg-[#34C759] text-black py-2 px-4 rounded hover:bg-[#2DBF4E]"
        >
          Volver a Rutinas
        </button>
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
    const Progress = (await import("../models/progress")).default;
    const decoded = jwt.verify(token, process.env.JWT_SECRET || "my-super-secret-key") as { userId: string };
    const progress = await Progress.find({ userId: decoded.userId }).lean();
    console.log("Progress fetched:", progress);
    return { props: { initialProgress: JSON.parse(JSON.stringify(progress)) } };
  } catch (error) {
    console.error("Error in getServerSideProps:", error);
    return { redirect: { destination: "/", permanent: false } };
  }
};