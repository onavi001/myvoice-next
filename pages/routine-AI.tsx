import React, { useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "../store";
import { generateRoutine } from "../store/routineSlice";

export default function RoutineAIPage() {
  const dispatch = useDispatch<AppDispatch>();
  const { routines, loading, error } = useSelector((state: RootState) => state.routine);
  const [formData, setFormData] = useState({
    level: "intermedio" as const,
    goal: "hipertrofia" as const,
    days: 3,
    equipment: "gym" as const,
    name: "Rutina de Volumen",
    notes: "Enfocarse en movimientos compuestos",
  });

  const handleChange = (field: keyof typeof formData, value: any) => {
    setFormData((prev) => ({ ...prev, [field]: value }));
  };

  const handleGenerate = () => {
    dispatch(generateRoutine(formData));
  };

  return (
    <div className="min-h-screen bg-[#1A1A1A] text-white p-4">
      <h1 className="text-lg font-bold text-[#34C759] mb-4">Generar Rutina</h1>
      
      {/* Formulario */}
      <div className="max-w-md mx-auto space-y-4">
        <input
          type="text"
          value={formData.name}
          onChange={(e) => handleChange("name", e.target.value)}
          placeholder="Nombre de la rutina"
          className="w-full bg-[#2D2D2D] border border-[#4A4A4A] text-white p-2 rounded-md"
        />
        <select
          value={formData.level}
          onChange={(e) => handleChange("level", e.target.value as any)}
          className="w-full bg-[#2D2D2D] border border-[#4A4A4A] text-white p-2 rounded-md"
        >
          <option value="principiante">Principiante</option>
          <option value="intermedio">Intermedio</option>
          <option value="avanzado">Avanzado</option>
        </select>
        <select
          value={formData.goal}
          onChange={(e) => handleChange("goal", e.target.value as any)}
          className="w-full bg-[#2D2D2D] border border-[#4A4A4A] text-white p-2 rounded-md"
        >
          <option value="fuerza">Fuerza</option>
          <option value="hipertrofia">Hipertrofia</option>
          <option value="resistencia">Resistencia</option>
        </select>
        <input
          type="number"
          value={formData.days}
          onChange={(e) => handleChange("days", Number(e.target.value))}
          placeholder="Días"
          className="w-full bg-[#2D2D2D] border border-[#4A4A4A] text-white p-2 rounded-md"
        />
        <select
          value={formData.equipment}
          onChange={(e) => handleChange("equipment", e.target.value as any)}
          className="w-full bg-[#2D2D2D] border border-[#4A4A4A] text-white p-2 rounded-md"
        >
          <option value="gym">Gimnasio</option>
          <option value="casa">Casa</option>
          <option value="pesas">Pesas</option>
        </select>
        <textarea
          value={formData.notes}
          onChange={(e) => handleChange("notes", e.target.value)}
          placeholder="Notas"
          className="w-full bg-[#2D2D2D] border border-[#4A4A4A] text-white p-2 rounded-md"
        />
        <button
          onClick={handleGenerate}
          disabled={loading}
          className="w-full bg-[#34C759] text-black p-2 rounded-md disabled:opacity-50"
        >
          {loading ? "Generando..." : "Generar Rutina"}
        </button>
      </div>

      {/* Vista previa */}
      {error && <p className="text-red-500 mt-4">{error}</p>}
      {routines.length > 0 && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold text-[#34C759]">{routines[0].name}</h2>
          {routines[0].days.map((day) => (
            <div key={day._id} className="mt-4 bg-[#252525] p-4 rounded-md">
              <h3 className="text-lg font-bold">{day.dayName}</h3>
              <p>{day.explanation}</p>
              <ul className="mt-2 space-y-2">
                {day.exercises.map((ex) => (
                  <li key={ex._id} className="text-sm">
                    {ex.name} - {ex.sets}x{ex.reps} ({ex.weight}) - Descanso: {ex.rest}
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}