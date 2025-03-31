import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useSelector, useDispatch } from "react-redux";
import { AppDispatch, RootState } from "../../store";
import { addProgress, editProgress, deleteProgress, clearProgress, fetchProgress } from "../../store/progressSlice";
import { fetchRoutines, ThunkError } from "../../store/routineSlice";
import Button from "../../components/Button";
import Input from "../../components/Input";
import Card from "../../components/Card";
import Toast from "../../components/Toast";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from "chart.js";
import { ProgressData } from "../../models/Progress";
import Loader from "../../components/Loader";
import { Types } from "mongoose";
import { GetServerSideProps } from "next";
import { dbConnect } from "../../lib/mongodb";
import RoutineModel, { RoutineData } from "../../models/Routine";
import ProgressModel from "../../models/Progress";
import DayModel, { IDay } from "../../models/Day";
import ExerciseModel, { IExercise } from "../../models/Exercise";
import jwt from "jsonwebtoken";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function ProgressPage({
  initialRoutines,
  initialProgress,
}: {
  initialRoutines: RoutineData[];
  initialProgress: ProgressData[];
}) {
  const dispatch = useDispatch<AppDispatch>();
  const { progress, loading: progressLoading } = useSelector((state: RootState) => state.progress);
  const { routines, loading: routineLoading } = useSelector((state: RootState) => state.routine);
  const { user, loading: userLoading } = useSelector((state: RootState) => state.user);
  const router = useRouter();

  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState<string>("");
  const [expandedCardKey, setExpandedCardKey] = useState<string | null>(null);
  const [showChart, setShowChart] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [editData, setEditData] = useState<Record<string, Partial<ProgressData>>>({});
  const [showAddForm, setShowAddForm] = useState<boolean>(false);
  const [newProgress, setNewProgress] = useState<Omit<ProgressData, "_id" | "userId">>({
    name: "",
    sets: 0,
    reps: 0,
    repsUnit: "count",
    weightUnit: "kg",
    weight: "",
    notes: "",
    date: new Date(),
  });
  const [addingProgress, setAddingProgress] = useState(false);
  const [savingProgress, setSavingProgress] = useState<Record<string, boolean>>({});
  const [deletingProgress, setDeletingProgress] = useState<Record<string, boolean>>({});
  const [clearingProgress, setClearingProgress] = useState(false);
  const [fetchingInitialData, setFetchingInitialData] = useState(true);
  const itemsPerPage = 10;

  useEffect(() => {
    if (user && !routines.length && !routineLoading) {
      dispatch(fetchRoutines.fulfilled(initialRoutines, "", undefined));
    }
    if (user && !progress.length && !progressLoading) {
      dispatch(fetchProgress.fulfilled(initialProgress, "", undefined));
    }
    setFetchingInitialData(false);
  }, [dispatch, user, initialRoutines, initialProgress, routineLoading, progressLoading]);

  const handleBack = () => router.push("/app/routine");

  const handleClear = async () => {
    setClearingProgress(true);
    try {
      await dispatch(clearProgress()).unwrap();
      setToastMessage("Progreso limpiado correctamente");
    } catch (err) {
      const error = err as ThunkError;
      if (error.message === "Unauthorized" && error.status === 401) {
        router.push("/login");
      } else {
        setToastMessage("Error al limpiar el progreso");
      }
    } finally {
      setClearingProgress(false);
    }
  };

  const handleCloseToast = () => setToastMessage(null);

  const toggleExpandCard = (key: string) => {
    setExpandedCardKey((prev) => (prev === key ? null : key));
  };

  const handleEditChange = (cardKey: string, field: keyof ProgressData, value: number | string) => {
    setEditData((prev) => ({
      ...prev,
      [cardKey]: { ...prev[cardKey], [field]: field === "date" ? new Date(value) : value },
    }));
  };

  const handleSaveEdit = async (progressId: Types.ObjectId) => {
    setSavingProgress((prev) => ({ ...prev, [progressId.toString()]: true }));
    const originalEntry = progress.find((p) => p._id === progressId);
    const updatedEntry = { ...originalEntry, ...editData[progressId.toString()] } as ProgressData;
    try {
      await dispatch(editProgress({ progressId, updatedEntry })).unwrap();
      setToastMessage("Progreso actualizado correctamente");
      setEditData((prev) => {
        const newData = { ...prev };
        delete newData[progressId.toString()];
        return newData;
      });
    } catch (err) {
      const error = err as ThunkError;
      if (error.message === "Unauthorized" && error.status === 401) {
        router.push("/login");
      } else {
        setToastMessage("Error al actualizar el progreso");
      }
    } finally {
      setSavingProgress((prev) => ({ ...prev, [progressId.toString()]: false }));
    }
  };

  const handleDelete = async (progressId: Types.ObjectId) => {
    setDeletingProgress((prev) => ({ ...prev, [progressId.toString()]: true }));
    try {
      await dispatch(deleteProgress(progressId)).unwrap();
      setToastMessage("Progreso eliminado correctamente");
      setExpandedCardKey(null);
    } catch (err) {
      const error = err as ThunkError;
      if (error.message === "Unauthorized" && error.status === 401) {
        router.push("/login");
      } else {
        setToastMessage("Error al eliminar el progreso");
      }
    } finally {
      setDeletingProgress((prev) => ({ ...prev, [progressId.toString()]: false }));
    }
  };

  const handleAddChange = (field: keyof Omit<ProgressData, "_id" | "userId">, value: number | string) => {
    setNewProgress((prev) => ({
      ...prev,
      [field]: field === "date" ? new Date(value) : value,
    }));
  };

  const handleAddSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!newProgress.name) {
      setToastMessage("El nombre del ejercicio es obligatorio.");
      return;
    }
    setAddingProgress(true);
    try {
      await dispatch(addProgress(newProgress)).unwrap();
      setToastMessage("Progreso agregado correctamente");
      setShowAddForm(false);
      setNewProgress({
        name: "",
        sets: 0,
        reps: 0,
        repsUnit: "count",
        weightUnit: "kg",
        weight: "",
        notes: "",
        date: new Date(),
      });
    } catch (err) {
      const error = err as ThunkError;
      if (error.message === "Unauthorized" && error.status === 401) {
        router.push("/login");
      } else {
        setToastMessage("Error al agregar el progreso");
      }
    } finally {
      setAddingProgress(false);
    }
  };

  const filteredProgress = progress.filter((entry) => {
    const query = searchQuery.toLowerCase();
    return (
      !query ||
      entry.name.toLowerCase().includes(query)
    );
  });

  const totalPages = Math.ceil(filteredProgress.length / itemsPerPage);
  const paginatedProgress = filteredProgress.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const chartData = {
    labels: filteredProgress.map((entry) => new Date(entry.date).toLocaleDateString()),
    datasets: [
      {
        label: "Peso",
        data: filteredProgress.map((entry) => parseFloat(entry.weight) || 0),
        borderColor: "#34C759",
        backgroundColor: "rgba(52, 199, 89, 0.2)",
        fill: true,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: { display: false },
      title: { display: true, text: "Progreso", color: "#FFFFFF", font: { size: 12 } },
    },
    scales: {
      x: { ticks: { color: "#B0B0B0", font: { size: 10 } } },
      y: { ticks: { color: "#B0B0B0", font: { size: 10 } } },
    },
  };

  if (fetchingInitialData || userLoading || routineLoading || progressLoading) {
    return (
      <div className="min-h-screen bg-[#1A1A1A] text-white flex flex-col items-center justify-center">
        <Loader />
        <p className="text-[#D1D1D1] text-xs mt-2">Cargando progreso...</p>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-white flex flex-col">
      <style>{`.scrollbar-hidden::-webkit-scrollbar { display: none; } .scrollbar-hidden { -ms-overflow-style: none; scrollbar-width: none; }`}</style>

      <div className="bg-[#1A1A1A] p-2 shadow-sm">
        <div className="max-w-md mx-auto">
          <Input
            name="search"
            type="text"
            placeholder="Buscar ejercicio..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#2D2D2D] border border-[#4A4A4A] text-white placeholder-[#B0B0B0] rounded-md p-2 text-xs focus:ring-1 focus:ring-[#34C759] focus:border-transparent"
          />
          <div className="flex justify-between mt-2">
            <label className="flex items-center text-[#D1D1D1] text-xs">
              <input
                type="checkbox"
                checked={showChart}
                onChange={() => setShowChart(!showChart)}
                className="mr-2 accent-[#34C759]"
              />
              Ver gráfica
            </label>
            <Button
              onClick={() => setShowAddForm(true)}
              className="bg-[#66BB6A] text-black hover:bg-[#4CAF50] rounded-md py-1 px-2 text-xs font-semibold border border-[#4CAF50] shadow-md"
            >
              + Agregar Progreso
            </Button>
          </div>
        </div>
      </div>

      <div className="flex-1 overflow-y-auto scrollbar-hidden">
        <div className="p-4 max-w-md mx-auto">
          {showChart && filteredProgress.length > 0 && (
            <Card className="mb-4 bg-[#252525] border-2 border-[#4A4A4A] p-2 rounded-md h-32">
              <Line data={chartData} options={chartOptions} />
            </Card>
          )}

          {filteredProgress.length === 0 ? (
            <p className="text-[#D1D1D1] text-xs mt-2">No hay progreso registrado con este filtro.</p>
          ) : (
            <>
              <ul className="space-y-2">
                {paginatedProgress.map((entry) => {
                  const cardKey = entry._id;
                  const isExpanded = expandedCardKey === cardKey.toString();
                  const edited = editData[cardKey.toString()] || {};
                  const currentEntry = { ...entry, ...edited } as ProgressData;
                  const isSaving = savingProgress[cardKey.toString()] || false;
                  const isDeleting = deletingProgress[cardKey.toString()] || false;

                  return (
                    <Card
                      key={cardKey.toString()}
                      className="bg-[#252525] border-2 border-[#4A4A4A] rounded-md overflow-hidden"
                    >
                      <div
                        className="flex justify-between items-center p-2 cursor-pointer hover:bg-[#3A3A3A] transition-colors"
                        onClick={() => toggleExpandCard(cardKey.toString())}
                      >
                        <span className="text-xs font-semibold text-white truncate">
                          {currentEntry.name}
                        </span>
                        <span className="text-[#D1D1D1] text-xs">{isExpanded ? "▲" : "▼"}</span>
                      </div>
                      {isExpanded && (
                        <div className="p-2 bg-[#2D2D2D] text-xs space-y-2">
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[#D1D1D1] text-xs font-medium">Fecha:</label>
                              <Input
                                name="date"
                                type="date"
                                value={new Date(currentEntry.date).toISOString().split("T")[0]}
                                onChange={(e) => handleEditChange(cardKey.toString(), "date", e.target.value)}
                                className="w-full bg-[#2D2D2D] border border-[#4A4A4A] text-white rounded-md p-2 text-xs focus:ring-1 focus:ring-[#34C759] focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="text-[#D1D1D1] text-xs font-medium">Series:</label>
                              <Input
                                name="sets"
                                type="number"
                                value={currentEntry.sets}
                                onChange={(e) =>
                                  handleEditChange(cardKey.toString(), "sets", Number(e.target.value))
                                }
                                className="w-full bg-[#2D2D2D] border border-[#4A4A4A] text-white rounded-md p-2 text-xs focus:ring-1 focus:ring-[#34C759] focus:border-transparent"
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-4 gap-2">
                            <div>
                              <label className="text-[#D1D1D1] text-xs font-medium">Reps:</label>
                              <Input
                                name="reps"
                                type="number"
                                value={currentEntry.reps}
                                onChange={(e) =>
                                  handleEditChange(cardKey.toString(), "reps", Number(e.target.value))
                                }
                                className="w-full bg-[#2D2D2D] border border-[#4A4A4A] text-white rounded-md p-2 text-xs focus:ring-1 focus:ring-[#34C759] focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="text-[#B0B0B0]">Unidad:</label>
                              <select
                                name="repsUnit"
                                value={currentEntry.repsUnit || "count"}
                                onChange={(e) => handleEditChange(cardKey.toString(), "repsUnit", e.target.value)}
                                className="w-full bg-[#2D2D2D] border border-[#4A4A4A] text-white p-2 rounded-md text-xs"
                              >
                                <option value="count">Unidades (U)</option>
                                <option value="seconds">Segundos (S)</option>
                              </select>
                            </div>
                            <div>
                              <label className="text-[#D1D1D1] text-xs font-medium">Peso:</label>
                              <Input
                                name="weight"
                                type="text"
                                value={currentEntry.weight}
                                onChange={(e) => handleEditChange(cardKey.toString(), "weight", e.target.value)}
                                className="w-full bg-[#2D2D2D] border border-[#4A4A4A] text-white rounded-md p-2 text-xs focus:ring-1 focus:ring-[#34C759] focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="text-[#B0B0B0]">Unidad:</label>
                              <select
                                name="weightUnit"
                                value={currentEntry.weightUnit || "kg"}
                                onChange={(e) => handleEditChange(cardKey.toString(), "weightUnit", e.target.value)}
                                className="w-full bg-[#2D2D2D] border border-[#4A4A4A] text-white p-2 rounded-md text-xs"
                              >
                                <option value="kg">Kilos (kg)</option>
                                <option value="lb">Libras (lb)</option>
                              </select>
                            </div>
                          </div>
                          <div className="col-span-2">
                            <label className="text-[#D1D1D1] text-xs font-medium">Notas:</label>
                            <textarea
                              value={currentEntry.notes || ""}
                              onChange={(e) => handleEditChange(cardKey.toString(), "notes", e.target.value)}
                              className="w-full bg-[#2D2D2D] border border-[#4A4A4A] text-white rounded-md p-2 text-xs h-8 resize-none focus:ring-1 focus:ring-[#34C759] focus:border-transparent"
                            />
                          </div>
                          <div className="flex space-x-2 mt-2">
                            <Button
                              onClick={() => handleSaveEdit(cardKey)}
                              disabled={isSaving || isDeleting}
                              className="w-full bg-[#66BB6A] text-black hover:bg-[#4CAF50] rounded-md py-1 px-2 text-xs font-semibold border border-[#4CAF50] shadow-md disabled:bg-[#4CAF50] disabled:opacity-50"
                            >
                              {isSaving ? <><Loader />Guardar</> : "Guardar"}
                            </Button>
                            <Button
                              onClick={() => handleDelete(cardKey)}
                              disabled={isSaving || isDeleting}
                              className="w-full bg-[#EF5350] text-white hover:bg-[#D32F2F] rounded-md py-1 px-2 text-xs font-semibold border border-[#D32F2F] shadow-md disabled:bg-[#D32F2F] disabled:opacity-50"
                            >
                              {isDeleting ? <><Loader/>Eliminar</> : "Eliminar"}
                            </Button>
                          </div>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </ul>

              {totalPages > 1 && (
                <div className="mt-4 flex justify-around items-center">
                  <Button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="max-w-12 p-2 bg-[#4A4A4A] text-[#D1D1D1] rounded-full disabled:opacity-50 text-xs font-semibold border border-[#4A4A4A] shadow-md"
                  >
                    ◄
                  </Button>
                  <span className="text-[#D1D1D1] text-xs font-semibold">
                    {currentPage}/{totalPages}
                  </span>
                  <Button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="max-w-12 p-2 bg-[#4A4A4A] text-[#D1D1D1] rounded-full disabled:opacity-50 text-xs font-semibold border border-[#4A4A4A] shadow-md"
                  >
                    ►
                  </Button>
                </div>
              )}
            </>
          )}
        </div>
      </div>

      {showAddForm && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-40">
          <Card className="bg-[#252525] border-2 border-[#4A4A4A] p-4 rounded-md max-w-md w-full">
            <h3 className="text-sm font-bold text-[#34C759] mb-2">Agregar Progreso</h3>
            <form onSubmit={handleAddSubmit} className="space-y-2">
              <div>
                <label className="block text-[#D1D1D1] text-xs font-medium mb-1">Ejercicio:</label>
                <Input
                  name="name"
                  type="text"
                  value={newProgress.name}
                  onChange={(e) => handleAddChange("name", e.target.value)}
                  className="w-full bg-[#2D2D2D] border border-[#4A4A4A] text-white rounded-md p-2 text-xs focus:ring-1 focus:ring-[#34C759] focus:border-transparent"
                  placeholder="Nombre del ejercicio"
                />
              </div>
              <div>
                <label className="block text-[#D1D1D1] text-xs font-medium mb-1">Series:</label>
                <Input
                  name="sets"
                  type="number"
                  value={newProgress.sets}
                  onChange={(e) => handleAddChange("sets", Number(e.target.value))}
                  className="w-full bg-[#2D2D2D] border border-[#4A4A4A] text-white rounded-md p-2 text-xs focus:ring-1 focus:ring-[#34C759] focus:border-transparent"
                />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <div>
                  <label className="block text-[#D1D1D1] text-xs font-medium mb-1">Reps:</label>
                  <Input
                    name="reps"
                    type="number"
                    value={newProgress.reps}
                    onChange={(e) => handleAddChange("reps", Number(e.target.value))}
                    className="w-full bg-[#2D2D2D] border border-[#4A4A4A] text-white rounded-md p-2 text-xs focus:ring-1 focus:ring-[#34C759] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-[#D1D1D1] text-xs font-medium mb-1">Unidad:</label>
                  <select
                    name="repsUnit"
                    value={newProgress.repsUnit}
                    onChange={(e) => handleAddChange("repsUnit", e.target.value)}
                    className="w-full bg-[#2D2D2D] border border-[#4A4A4A] text-white p-2 rounded-md text-xs"
                  >
                    <option value="count">Unidades (U)</option>
                    <option value="seconds">Segundos (S)</option>
                  </select>
                </div>
                <div>
                  <label className="block text-[#D1D1D1] text-xs font-medium mb-1">Peso:</label>
                  <Input
                    name="weight"
                    type="text"
                    value={newProgress.weight}
                    onChange={(e) => handleAddChange("weight", e.target.value)}
                    className="w-full bg-[#2D2D2D] border border-[#4A4A4A] text-white rounded-md p-2 text-xs focus:ring-1 focus:ring-[#34C759] focus:border-transparent"
                  />
                </div>
                <div>
                  <label className="block text-[#D1D1D1] text-xs font-medium mb-1">Unidad:</label>
                  <select
                    name="weightUnit"
                    value={newProgress.weightUnit}
                    onChange={(e) => handleAddChange("weightUnit", e.target.value)}
                    className="w-full bg-[#2D2D2D] border border-[#4A4A4A] text-white p-2 rounded-md text-xs"
                  >
                    <option value="kg">Kilos (kg)</option>
                    <option value="lb">Libras (lb)</option>
                  </select>
                </div>
              </div>
              <div>
                <label className="block text-[#D1D1D1] text-xs font-medium mb-1">Notas:</label>
                <textarea
                  value={newProgress.notes}
                  onChange={(e) => handleAddChange("notes", e.target.value)}
                  className="w-full bg-[#2D2D2D] border border-[#4A4A4A] text-white rounded-md p-2 text-xs h-8 resize-none focus:ring-1 focus:ring-[#34C759] focus:border-transparent"
                />
              </div>
              <div>
                <label className="block text-[#D1D1D1] text-xs font-medium mb-1">Fecha:</label>
                <Input
                  name="date"
                  type="date"
                  value={newProgress.date.toISOString().split("T")[0]}
                  onChange={(e) => handleAddChange("date", e.target.value)}
                  className="w-full bg-[#2D2D2D] border border-[#4A4A4A] text-white rounded-md p-2 text-xs focus:ring-1 focus:ring-[#34C759] focus:border-transparent"
                />
              </div>
              <div className="flex space-x-2">
                <Button
                  type="submit"
                  disabled={addingProgress}
                  className="w-full bg-[#66BB6A] text-black hover:bg-[#4CAF50] rounded-md py-1 px-2 text-xs font-semibold border border-[#4CAF50] shadow-md disabled:bg-[#4CAF50] disabled:opacity-50"
                >
                  {addingProgress ? <><Loader />Guardar</> : "Guardar"}
                </Button>
                <Button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  disabled={addingProgress}
                  className="w-full bg-[#EF5350] text-white hover:bg-[#D32F2F] rounded-md py-1 px-2 text-xs font-semibold border border-[#D32F2F] shadow-md disabled:bg-[#D32F2F] disabled:opacity-50"
                >
                  Cancelar
                </Button>
              </div>
            </form>
          </Card>
        </div>
      )}

      <div className="fixed bottom-4 right-4 z-10">
        <Button
          onClick={handleClear}
          disabled={clearingProgress}
          className="bg-[#EF5350] text-white p-3 rounded-full shadow-md hover:bg-[#D32F2F] border border-[#D32F2F] disabled:bg-[#D32F2F] disabled:opacity-50"
        >
          {clearingProgress ? <><Loader />🗑️</> : "🗑️"}
        </Button>
      </div>

      <div className="fixed bottom-4 left-4 z-10">
        <Button
          onClick={handleBack}
          className="bg-[#42A5F5] text-black p-3 rounded-full shadow-md hover:bg-[#1E88E5] border border-[#1E88E5]"
        >
          ←
        </Button>
      </div>

      {toastMessage && <Toast message={toastMessage} onClose={handleCloseToast} />}
    </div>
  );
}

export const getServerSideProps: GetServerSideProps = async (context) => {
  const token = context.req.cookies.token;
  if (!token) {
    return { redirect: { destination: "/login", permanent: false } };
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
        },
      })
      .lean();

    const progress = await ProgressModel.find({ userId: decoded.userId }).lean();

    const serializedRoutines = routines.map((r) => ({
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
          notes: exercise.notes || "",
          circuitId: exercise.circuitId || "",
        })),
      })),
      createdAt: r.createdAt ? new Date(r.createdAt).toISOString() : new Date().toISOString(),
      updatedAt: r.updatedAt ? new Date(r.updatedAt).toISOString() : new Date().toISOString(),
    }));

    const serializedProgress = progress.map((p) => ({
      _id: p._id.toString(),
      userId: p.userId.toString(),
      name: p.name,
      sets: p.sets || 0,
      reps: p.reps || 0,
      repsUnit: p.repsUnit || "count",
      weightUnit: p.weightUnit || "kg",
      weight: p.weight || "",
      notes: p.notes || "",
      date: p.date ? new Date(p.date).toISOString() : new Date().toISOString(),
    }));

    return {
      props: {
        initialRoutines: serializedRoutines,
        initialProgress: serializedProgress,
      },
    };
  } catch (error) {
    console.error("Error en getServerSideProps:", error);
    return { redirect: { destination: "/login", permanent: false } };
  }
};