import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../../../../store";
import { ThunkError, updateExercise } from "../../../../store/routineSlice";
import Button from "../../../../components/Button";
import Input from "../../../../components/Input";
import Card from "../../../../components/Card";
import Loader from "../../../../components/Loader";
import { IVideo } from "../../../../models/Video";
import { Types } from "mongoose";

export default function ExerciseVideosPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { routines, loading: reduxLoading } = useSelector((state: RootState) => state.routine);
  const router = useRouter();
  const { routineId, dayIndex, exerciseIndex } = router.query;

  const [videos, setVideos] = useState<IVideo[]>([]);
  const [newVideoUrl, setNewVideoUrl] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Cargar videos iniciales desde la rutina
  useEffect(() => {
    if (routineId && dayIndex && exerciseIndex && routines.length > 0) {
      const routine = routines.find((r) => r._id.toString() === routineId);
      if (routine) {
        const day = routine.days[Number(dayIndex)];
        if (day) {
          const exercise = day.exercises[Number(exerciseIndex)];
          if (exercise) {
            setVideos(exercise.videos || []);
          }
        }
      }
    }
  }, [routines, routineId, dayIndex, exerciseIndex]);

  const handleAddVideo = () => {
    if (!newVideoUrl.trim()) {
      setError("La URL del video no puede estar vacía");
      return;
    }
    //quitar id temporal al crear video
    setVideos([...videos, { _id: new Types.ObjectId(`${Date.now()}`), url: newVideoUrl, isCurrent: false }]);
    setNewVideoUrl("");
    setError(null);
  };

  const handleRemoveVideo = (videoId: Types.ObjectId) => {
    setVideos(videos.filter((video) => video._id !== videoId));
  };

  const handleSetCurrent = (videoId: Types.ObjectId) => {
    setVideos(
      videos.map((video) => ({
        ...video,
        isCurrent: video._id === videoId,
      }))
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError(null);

    try {
      const routine = routines.find((r) => r._id.toString() === routineId);
      if (!routine || dayIndex === undefined || exerciseIndex === undefined) {
        throw new Error("Datos inválidos");
      }

      const day = routine.days[Number(dayIndex)];
      const exercise = day.exercises[Number(exerciseIndex)];

      await dispatch(
        updateExercise({
          routineId: new Types.ObjectId(routineId?.toString()),
          dayId: day._id,
          exerciseId: exercise._id,
          exerciseData: {
            ...exercise,
            videos: videos,
          },
        })
      ).unwrap();

      router.push(`/app/routine-edit/${routineId}`);
    } catch (err) {
      const error = err as ThunkError;
      if (error.message === "Unauthorized" && error.status === 401) {
        router.push("/login");
      } else {
        setError("Error al actualizar los videos");
        console.error(err);
      }
    } finally {
      setLoading(false);
    }
  };

  if (loading || reduxLoading) return <Loader/>;
  if (!routineId || dayIndex === undefined || exerciseIndex === undefined) return <div className="min-h-screen bg-[#1A1A1A] text-white flex items-center justify-center">Datos inválidos</div>;

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-white flex flex-col">
      <div className="p-4 max-w-md mx-auto flex-1 mt-10">
        <h1 className="text-lg font-bold mb-3 text-white">Editar Videos del Ejercicio</h1>
        <form onSubmit={handleSubmit} className="space-y-4">
          {/* Lista de videos */}
          <Card className="p-2 bg-[#252525] border-2 border-[#4A4A4A] rounded-md mb-2">
            <div className="py-1 bg-[#2D2D2D] px-2 rounded-t-md">
              <h2 className="text-sm font-bold text-[#34C759]">Videos</h2>
            </div>
            <div className="mt-1 space-y-2">
              {videos.length === 0 ? (
                <p className="text-[#D1D1D1] text-xs">No hay videos aún</p>
              ) : (
                videos.map((video, videoIndex) => (
                  <div
                    key={video._id.toString()}
                    className="space-y-1 border-t border-[#3A3A3A] pt-2"
                  >
                    <label className="block text-[#D1D1D1] text-xs font-semibold">
                      Video {videoIndex + 1} {video.isCurrent ? "(Actual)" : ""}
                    </label>
                    <Input
                      name="videoUrl"
                      type="text"
                      value={video.url}
                      //disabled
                      className="bg-[#2D2D2D] border border-[#4A4A4A] text-white placeholder-[#B0B0B0] rounded-md p-2 text-xs w-full disabled:opacity-70" 
                      onChange={function (): void {
                        throw new Error("Function not implemented.");
                      } }                    />
                    <div className="flex space-x-2">
                      <Button
                        variant="secondary"
                        type="button"
                        onClick={() => handleSetCurrent(video._id)}
                        className="w-1/2 bg-[#42A5F5] text-black hover:bg-[#1E88E5] rounded-md py-1 px-2 text-xs font-semibold border border-[#1E88E5] shadow-md"
                      >
                        Hacer Actual
                      </Button>
                      <Button
                        type="button"
                        onClick={() => handleRemoveVideo(video._id)}
                        className="w-1/2 bg-[#EF5350] text-white hover:bg-[#D32F2F] rounded-md py-1 px-2 text-xs font-semibold border border-[#D32F2F] shadow-md"
                      >
                        Eliminar
                      </Button>
                    </div>
                  </div>
                ))
              )}
            </div>
          </Card>

          {/* Agregar nuevo video */}
          <div>
            <label className="block text-[#D1D1D1] text-xs font-medium mb-1">Nuevo Video (URL)</label>
            <Input
              name="newVideoUrl"
              value={newVideoUrl}
              onChange={(e) => setNewVideoUrl(e.target.value)}
              placeholder="https://ejemplo.com/video.mp4"
              className="bg-[#2D2D2D] border border-[#4A4A4A] text-white placeholder-[#B0B0B0] rounded-md p-2 text-xs w-full focus:ring-1 focus:ring-[#34C759] focus:border-transparent"
            />
            <Button
              variant="secondary"
              type="button"
              onClick={handleAddVideo}
              className="mt-2 w-full bg-[#66BB6A] text-black hover:bg-[#4CAF50] rounded-md py-1 px-2 text-xs font-semibold border border-[#4CAF50] shadow-md"
            >
              + Agregar Video
            </Button>
          </div>

          {/* Botones de acción */}
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
              onClick={() => router.push(`/app/routine-edit/${routineId}`)}
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