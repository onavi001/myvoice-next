// store/progressSlice.ts
import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";
import { RootState } from "./index";

interface ProgressEntry {
  _id?: string;
  routineId: string;
  dayIndex: number;
  exerciseIndex: number;
  sets: number;
  reps: number;
  weight: string;
  notes: string;
  date: string;
  userId: string;
}

interface ProgressState {
  progress: ProgressEntry[];
  loading: boolean;
  error: string | null;
}

const initialState: ProgressState = {
  progress: [],
  loading: false,
  error: null,
};

export const fetchProgress = createAsyncThunk("progress/fetchProgress", async (_, { getState }) => {
  const response = await fetch("/api/progress", {
    headers: { "Content-Type": "application/json" },
  });
  if (!response.ok) throw new Error("Error al obtener el progreso");
  return await response.json();
});

export const addProgress = createAsyncThunk("progress/addProgress", async (progress: ProgressEntry) => {
  const response = await fetch("/api/progress", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(progress),
  });
  if (!response.ok) throw new Error("Error al agregar el progreso");
  return await response.json();
});

export const editProgress = createAsyncThunk(
  "progress/editProgress",
  async ({ cardKey, updatedEntry }: { cardKey: string; updatedEntry: ProgressEntry }) => {
    const response = await fetch(`/api/progress/${updatedEntry._id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(updatedEntry),
    });
    if (!response.ok) throw new Error("Error al actualizar el progreso");
    return await response.json();
  }
);

export const deleteProgress = createAsyncThunk("progress/deleteProgress", async (cardKey: string, { getState }) => {
  const progressEntry = (getState() as RootState).progress.progress.find(
    (p) => `${p.routineId}-${p.dayIndex}-${p.exerciseIndex}-${p.date}` === cardKey
  );
  if (!progressEntry || !progressEntry._id) throw new Error("Progreso no encontrado");
  const response = await fetch(`/api/progress/${progressEntry._id}`, {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Error al eliminar el progreso");
  return cardKey;
});

export const clearProgress = createAsyncThunk("progress/clearProgress", async () => {
  const response = await fetch("/api/progress", {
    method: "DELETE",
  });
  if (!response.ok) throw new Error("Error al limpiar el progreso");
  return await response.json();
});

const progressSlice = createSlice({
  name: "progress",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      .addCase(fetchProgress.pending, (state) => {
        state.loading = true;
      })
      .addCase(fetchProgress.fulfilled, (state, action) => {
        state.loading = false;
        state.progress = action.payload;
      })
      .addCase(fetchProgress.rejected, (state, action) => {
        state.loading = false;
        state.error = action.error.message || "Error al obtener el progreso";
      })
      .addCase(addProgress.fulfilled, (state, action) => {
        state.progress.push(action.payload);
      })
      .addCase(editProgress.fulfilled, (state, action) => {
        const index = state.progress.findIndex((p) => p._id === action.payload._id);
        if (index !== -1) state.progress[index] = action.payload;
      })
      .addCase(deleteProgress.fulfilled, (state, action) => {
        state.progress = state.progress.filter(
          (p) => `${p.routineId}-${p.dayIndex}-${p.exerciseIndex}-${p.date}` !== action.payload
        );
      })
      .addCase(clearProgress.fulfilled, (state) => {
        state.progress = [];
      });
  },
});

export default progressSlice.reducer;