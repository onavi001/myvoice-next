import React, { useState, useEffect } from "react";
import { useRouter } from "next/router";
import { useSelector, useDispatch } from "react-redux";
import { AppDispatch, RootState } from "../store";
import { addProgress, editProgress, deleteProgress, clearProgress, fetchProgress } from "../store/progressSlice";
import { fetchRoutines } from "../store/routineSlice";
import Button from "../components/Button";
import Input from "../components/Input";
import Card from "../components/Card";
import Toast from "../components/Toast";
import { Line } from "react-chartjs-2";
import { Chart as ChartJS, CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend } from "chart.js";
import { ProgressData } from "../models/Progress";

ChartJS.register(CategoryScale, LinearScale, PointElement, LineElement, Title, Tooltip, Legend);

export default function ProgressPage() {
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
    routineId: routines[0]?._id || "",
    dayIndex: 0,
    exerciseIndex: 0,
    sets: 0,
    reps: 0,
    weightUnit: "kg",
    repsUnit: "count",
    weight: "",
    notes: "",
    date: new Date(),
  });
  const itemsPerPage = 5;

  useEffect(() => {
    if (user && !routines.length && !routineLoading) {
      dispatch(fetchRoutines());
    }
  }, [dispatch, user]);

  useEffect(() => {
    if (user && !progress.length && !progressLoading) {
      dispatch(fetchProgress());
    }
  }, [dispatch, user, routines, routineLoading]);
  useEffect(() => {
    if (!userLoading && !user) {
      router.push("/");
    }
  }, [user, userLoading, router]);

  const handleBack = () => router.push("/routine");

  const handleClear = () => {
    dispatch(clearProgress()).then(() => setToastMessage("Progreso limpiado correctamente"));
  };

  const handleCloseToast = () => setToastMessage(null);

  const toggleExpandCard = (key: string) => {
    setExpandedCardKey((prev) => (prev === key ? null : key));
  };

  const handleEditChange = (cardKey: string, field: keyof ProgressData, value: number | string) => {
    console.log(cardKey, field, value);
    setEditData((prev) => ({
      ...prev,
      [cardKey]: { ...prev[cardKey], [field]: field === "date" ? new Date(value) : value },
    }));
  };

  const handleSaveEdit = (progressId: string) => {
    const originalEntry = progress.find((p) => p._id === progressId);
    const updatedEntry = { ...originalEntry, ...editData[progressId] } as ProgressData;
    dispatch(editProgress({ progressId, updatedEntry })).then(() => {
      setToastMessage("Progreso actualizado correctamente");
      setEditData((prev) => {
        const newData = { ...prev };
        delete newData[progressId];
        return newData;
      });
    });
  };

  const handleDelete = (progressId: string) => {
    dispatch(deleteProgress(progressId)).then(() => {
      setToastMessage("Progreso eliminado correctamente");
      setExpandedCardKey(null);
    });
  };

  const handleAddChange = (field: keyof Omit<ProgressData, "_id" | "userId">, value: number | string) => {
    setNewProgress((prev) => ({
      ...prev,
      [field]: field === "date" ? new Date(value) : value,
    }));
  };

  const handleAddSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    dispatch(addProgress(newProgress)).then(() => {
      setToastMessage("Progreso agregado correctamente");
      setShowAddForm(false);
      setNewProgress({
        routineId: routines[0]?._id || "",
        dayIndex: 0,
        exerciseIndex: 0,
        sets: 0,
        reps: 0,
        weightUnit: "kg",
        repsUnit: "count",
        weight: "",
        notes: "",
        date: new Date(),
      });
    });
  };

  const filteredProgress = progress.filter((entry) => {
    const routine = routines.find((r) => r._id === entry.routineId);
    const day = routine?.days[entry.dayIndex];
    const exercise = day?.exercises[entry.exerciseIndex];
    const query = searchQuery.toLowerCase();
    return (
      !query ||
      routine?.name.toLowerCase().includes(query) ||
      day?.dayName.toLowerCase().includes(query) ||
      exercise?.name.toLowerCase().includes(query) ||
      exercise?.muscleGroup.join(", ")?.toLowerCase().includes(query)
    );
  });

  const totalPages = Math.ceil(filteredProgress.length / itemsPerPage);
  const paginatedProgress = filteredProgress.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  const chartData = {
    labels: filteredProgress.map((entry) => entry.date.toLocaleDateString()),
    datasets: [
      {
        label: "Peso (kg)",
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

  if (userLoading || routineLoading || progressLoading) return <div className="min-h-screen bg-[#1A1A1A] text-white flex items-center justify-center">Cargando...</div>;

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-white flex flex-col">
      <style>{`.scrollbar-hidden::-webkit-scrollbar { display: none; } .scrollbar-hidden { -ms-overflow-style: none; scrollbar-width: none; }`}</style>

      <div className="bg-[#1A1A1A] p-2 shadow-sm z-30">
        <div className="max-w-md mx-auto">
          <Input
            name="search"
            type="text"
            placeholder="Buscar (músculo, ejercicio...)"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full bg-[#2D2D2D] border border-[#4A4A4A] text-white placeholder-[#B0B0B0] rounded-md p-2 text-xs focus:ring-1 focus:ring-[#34C759] focus:border-transparent"
          />
          <div className="flex justify-between mt-2">
            <label className="flex items-center text-[#D1D1D1] text-xs">
              <input type="checkbox" checked={showChart} onChange={() => setShowChart(!showChart)} className="mr-2 accent-[#34C759]" />
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
                  const routine = routines.find((r) => r._id === entry.routineId);
                  const day = routine?.days[entry.dayIndex];
                  const exercise = day?.exercises[entry.exerciseIndex];
                  const cardKey = entry._id;
                  const isExpanded = expandedCardKey === cardKey;
                  const edited = editData[cardKey] || {};
                  const currentEntry = { ...entry, ...edited } as ProgressData;

                  return (
                    <Card key={cardKey} className="bg-[#252525] border-2 border-[#4A4A4A] rounded-md overflow-hidden">
                      <div
                        className="flex justify-between items-center p-2 cursor-pointer hover:bg-[#3A3A3A] transition-colors"
                        onClick={() => toggleExpandCard(cardKey)}
                      >
                        <span className="text-xs font-semibold text-white truncate">
                          {exercise?.name || "Ejercicio desconocido"}
                        </span>
                        <span className="text-[#D1D1D1] text-xs">{isExpanded ? "▲" : "▼"}</span>
                      </div>
                      {isExpanded && (
                        <div className="p-2 bg-[#2D2D2D] text-xs space-y-2">
                          <p className="text-[#D1D1D1]">
                            {routine?.name || "Rutina desconocida"} - {day?.dayName || "Día desconocido"}
                          </p>
                          <p className="text-[#B0B0B0]">Músculo: {exercise?.muscleGroup || "Desconocido"}</p>
                          <div className="grid grid-cols-2 gap-2">
                            <div>
                              <label className="text-[#D1D1D1] text-xs font-medium">Fecha:</label>
                              <Input
                                name="date"
                                type="date"
                                value={currentEntry.date.toISOString().split("T")[0]}
                                onChange={(e) => handleEditChange(cardKey, "date", e.target.value)}
                                className="w-full bg-[#2D2D2D] border border-[#4A4A4A] text-white rounded-md p-2 text-xs focus:ring-1 focus:ring-[#34C759] focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="text-[#D1D1D1] text-xs font-medium">Series:</label>
                              <Input
                                name="sets"
                                type="number"
                                value={currentEntry.sets}
                                onChange={(e) => handleEditChange(cardKey, "sets", Number(e.target.value))}
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
                                onChange={(e) => handleEditChange(cardKey, "reps", Number(e.target.value))}
                                className="w-full bg-[#2D2D2D] border border-[#4A4A4A] text-white rounded-md p-2 text-xs focus:ring-1 focus:ring-[#34C759] focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="text-[#B0B0B0]">Unidad:</label>
                              <select
                                name="repsUnit"
                                value={currentEntry.repsUnit || "count"}
                                onChange={(e) => handleEditChange(cardKey, "repsUnit", e.target.value)}
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
                                onChange={(e) => handleEditChange(cardKey, "weight", e.target.value)}
                                className="w-full bg-[#2D2D2D] border border-[#4A4A4A] text-white rounded-md p-2 text-xs focus:ring-1 focus:ring-[#34C759] focus:border-transparent"
                              />
                            </div>
                            <div>
                              <label className="text-[#B0B0B0]">Unidad:</label>
                              <select
                                name="weightUnit"
                                value={currentEntry.weightUnit || "kg"}
                                onChange={(e) => handleEditChange(cardKey, "weightUnit", e.target.value)}
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
                              onChange={(e) => handleEditChange(cardKey, "notes", e.target.value)}
                              className="w-full bg-[#2D2D2D] border border-[#4A4A4A] text-white rounded-md p-2 text-xs h-8 resize-none focus:ring-1 focus:ring-[#34C759] focus:border-transparent"
                            />
                          </div>
                          <div className="flex space-x-2 mt-2">
                            <Button
                              
                              onClick={() => handleSaveEdit(cardKey)}
                              className="w-full bg-[#66BB6A] text-black hover:bg-[#4CAF50] rounded-md py-1 px-2 text-xs font-semibold border border-[#4CAF50] shadow-md"
                            >
                              Guardar
                            </Button>
                            <Button
                              onClick={() => handleDelete(cardKey)}
                              className="w-full bg-[#EF5350] text-white hover:bg-[#D32F2F] rounded-md py-1 px-2 text-xs font-semibold border border-[#D32F2F] shadow-md"
                            >
                              Eliminar
                            </Button>
                          </div>
                        </div>
                      )}
                    </Card>
                  );
                })}
              </ul>

              {totalPages > 1 && (
                <div className="mt-4 flex justify-between items-center">
                  <Button
                    onClick={() => setCurrentPage((prev) => Math.max(prev - 1, 1))}
                    disabled={currentPage === 1}
                    className="p-2 bg-[#4A4A4A] text-[#D1D1D1] rounded-full disabled:opacity-50 text-xs font-semibold border border-[#4A4A4A] shadow-md"
                  >
                    ◄
                  </Button>
                  <span className="text-[#D1D1D1] text-xs font-semibold">
                    {currentPage}/{totalPages}
                  </span>
                  <Button
                    onClick={() => setCurrentPage((prev) => Math.min(prev + 1, totalPages))}
                    disabled={currentPage === totalPages}
                    className="p-2 bg-[#4A4A4A] text-[#D1D1D1] rounded-full disabled:opacity-50 text-xs font-semibold border border-[#4A4A4A] shadow-md"
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
                <label className="block text-[#D1D1D1] text-xs font-medium mb-1">Rutina:</label>
                <select
                  value={newProgress.routineId}
                  onChange={(e) => handleAddChange("routineId", e.target.value)}
                  className="w-full bg-[#2D2D2D] border border-[#4A4A4A] text-white rounded-md p-2 text-xs focus:ring-1 focus:ring-[#34C759] focus:border-transparent"
                >
                  {routines.map((routine) => (
                    <option key={routine._id} value={routine._id}>{routine.name}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[#D1D1D1] text-xs font-medium mb-1">Día:</label>
                <select
                  value={newProgress.dayIndex}
                  onChange={(e) => handleAddChange("dayIndex", Number(e.target.value))}
                  className="w-full bg-[#2D2D2D] border border-[#4A4A4A] text-white rounded-md p-2 text-xs focus:ring-1 focus:ring-[#34C759] focus:border-transparent"
                >
                  {routines.find((r) => r._id === newProgress.routineId)?.days.map((day, idx) => (
                    <option key={idx} value={idx}>{day.dayName}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-[#D1D1D1] text-xs font-medium mb-1">Ejercicio:</label>
                <select
                  value={newProgress.exerciseIndex}
                  onChange={(e) => handleAddChange("exerciseIndex", Number(e.target.value))}
                  className="w-full bg-[#2D2D2D] border border-[#4A4A4A] text-white rounded-md p-2 text-xs focus:ring-1 focus:ring-[#34C759] focus:border-transparent"
                >
                  {routines.find((r) => r._id === newProgress.routineId)?.days[newProgress.dayIndex]?.exercises.map((exercise, idx) => (
                    <option key={idx} value={idx}>{exercise.name}</option>
                  ))}
                </select>
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
                  className="w-full bg-[#66BB6A] text-black hover:bg-[#4CAF50] rounded-md py-1 px-2 text-xs font-semibold border border-[#4CAF50] shadow-md"
                >
                  Guardar
                </Button>
                <Button
                  type="button"
                  onClick={() => setShowAddForm(false)}
                  className="w-full bg-[#EF5350] text-white hover:bg-[#D32F2F] rounded-md py-1 px-2 text-xs font-semibold border border-[#D32F2F] shadow-md"
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
          className="bg-[#EF5350] text-white p-3 rounded-full shadow-md hover:bg-[#D32F2F] border border-[#D32F2F]"
        >
          🗑️
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