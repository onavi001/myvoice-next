import { useEffect } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState, AppDispatch } from "../store";
import { fetchProgress } from "../store/progressSlice";
import { useRouter } from "next/router";

export default function ProgressPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { progress, loading, error } = useSelector((state: RootState) => state.progress);
  const { user } = useSelector((state: RootState) => state.user);
  const router = useRouter();

  useEffect(() => {
    if (!user) router.push("/");
    else dispatch(fetchProgress(user._id));
  }, [dispatch, user, router]);

  if (loading) return <div className="min-h-screen bg-[#1A1A1A] text-white flex items-center justify-center">Cargando...</div>;
  if (error) return <div className="min-h-screen bg-[#1A1A1A] text-white flex items-center justify-center">Error: {error}</div>;

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-white flex flex-col">
      <div className="p-4 max-w-full mx-auto flex-1">
        <h1 className="text-xl font-semibold mb-4">Progreso</h1>
        <ul className="space-y-2">
          {progress.map((entry) => (
            <li key={entry._id} className="bg-[#2D2D2D] rounded-lg shadow-sm p-2">
              <p className="text-sm">Ejercicio: {entry.exerciseId}</p>
              <p className="text-xs text-[#B0B0B0]">Series: {entry.sets}, Reps: {entry.reps}, Peso: {entry.weight}</p>
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