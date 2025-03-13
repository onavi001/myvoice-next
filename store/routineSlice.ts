import { createSlice, createAsyncThunk, PayloadAction } from "@reduxjs/toolkit";
import { RoutineData } from "../models/Routine";

interface RoutineInput {
  level: "principiante" | "intermedio" | "avanzado";
  goal: "fuerza" | "hipertrofia" | "resistencia";
  days: number;
  equipment: "gym" | "casa" | "pesas";
  name?: string;
  notes?: string;
}

interface RoutineState {
  routines: RoutineData[];
  selectedRoutineIndex: number | null;
  loading: boolean;
  error: string | null;
}

const initialState: RoutineState = {
  routines: [],
  selectedRoutineIndex: null,
  loading: false,
  error: null,
};

// Fetch todas las rutinas del usuario
export const fetchRoutines = createAsyncThunk(
  "routine/fetchRoutines",
  async (_, { getState, rejectWithValue }) => {
    const state = getState() as { user: { token: string } };
    const token = state.user.token;
    try {
      const response = await fetch("/api/routines", {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Error al obtener rutinas");
      const data = await response.json();
      return data as RoutineData[];
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// Crear una nueva rutina
export const createRoutine = createAsyncThunk(
  "routine/createRoutine",
  async (routineData: { name: string; days: { dayName: string; exercises: { name: string; sets: number; reps: number }[] }[] }, { getState, rejectWithValue }) => {
    const state = getState() as { user: { token: string } };
    const token = state.user.token;
    try {
      const response = await fetch("/api/routines", {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(routineData),
      });
      if (!response.ok) throw new Error("Error al crear rutina");
      const data = await response.json();
      return data as RoutineData;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// Actualizar una rutina
export const updateRoutine = createAsyncThunk(
  "routine/updateRoutine",
  async ({ routineId, name }: { routineId: string; name: string }, { getState, rejectWithValue }) => {
    const state = getState() as { user: { token: string } };
    const token = state.user.token;
    try {
      const response = await fetch(`/api/routines/${routineId}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ name }),
      });
      if (!response.ok) throw new Error("Error al actualizar rutina");
      const data = await response.json();
      return data as RoutineData;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// Eliminar una rutina
export const deleteRoutine = createAsyncThunk(
  "routine/deleteRoutine",
  async (routineId: string, { getState, rejectWithValue }) => {
    const state = getState() as { user: { token: string } };
    const token = state.user.token;
    try {
      const response = await fetch(`/api/routines/${routineId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Error al eliminar rutina");
      return routineId;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// Seleccionar una rutina
export const selectRoutine = createAsyncThunk(
  "routine/selectRoutine",
  async (index: number, { getState }) => {
    const state = getState() as { routine: RoutineState };
    if (index >= 0 && index < state.routine.routines.length) {
      return index;
    }
    throw new Error("Índice de rutina inválido");
  }
);

// Crear un día en una rutina
export const createDay = createAsyncThunk(
  "routine/createDay",
  async ({ routineId, dayData }: { routineId: string; dayData: { dayName: string; exercises: { name: string; sets: number; reps: number }[] } }, { getState, rejectWithValue }) => {
    const state = getState() as { user: { token: string } };
    const token = state.user.token;
    try {
      const response = await fetch(`/api/routines/${routineId}/days`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(dayData),
      });
      if (!response.ok) throw new Error("Error al crear día");
      const data = await response.json();
      return { routineId, day: data };
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// Actualizar un día
export const updateDay = createAsyncThunk(
  "routine/updateDay",
  async ({ routineId, dayId, dayName }: { routineId: string; dayId: string; dayName: string }, { getState, rejectWithValue }) => {
    const state = getState() as { user: { token: string } };
    const token = state.user.token;
    try {
      const response = await fetch(`/api/days/${dayId}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ dayName }),
      });
      if (!response.ok) throw new Error("Error al actualizar día");
      const data = await response.json();
      return { routineId, dayId, dayName: data.dayName };
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// Eliminar un día
export const deleteDay = createAsyncThunk(
  "routine/deleteDay",
  async ({ routineId, dayId }: { routineId: string; dayId: string }, { getState, rejectWithValue }) => {
    const state = getState() as { user: { token: string } };
    const token = state.user.token;
    try {
      const response = await fetch(`/api/days/${dayId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Error al eliminar día");
      return { routineId, dayId };
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// Crear un ejercicio en un día
export const createExercise = createAsyncThunk(
  "routine/createExercise",
  async (
    { routineId, dayId, exerciseData }: { routineId: string; dayId: string; exerciseData: { name: string; sets: number; reps: number } },
    { getState, rejectWithValue }
  ) => {
    const state = getState() as { user: { token: string } };
    const token = state.user.token;
    try {
      const response = await fetch(`/api/days/${dayId}/exercises`, {
        method: "POST",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(exerciseData),
      });
      if (!response.ok) throw new Error("Error al crear ejercicio");
      const data = await response.json();
      return { routineId, dayId, exercise: data };
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// Actualizar un ejercicio
export const updateExercise = createAsyncThunk(
  "routine/updateExercise",
  async (
    { routineId, dayId, exerciseId, exerciseData }: { routineId: string; dayId: string; exerciseId: string; exerciseData: Partial<RoutineData["days"][number]["exercises"][number]> },
    { getState, rejectWithValue }
  ) => {
    const state = getState() as { user: { token: string } };
    const token = state.user.token;
    try {
      const response = await fetch(`/api/exercises/${exerciseId}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify(exerciseData),
      });
      if (!response.ok) throw new Error("Error al actualizar ejercicio");
      const data = await response.json();
      return { routineId, dayId, exerciseId, exercise: data };
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// Eliminar un ejercicio
export const deleteExercise = createAsyncThunk(
  "routine/deleteExercise",
  async ({ routineId, dayId, exerciseId }: { routineId: string; dayId: string; exerciseId: string }, { getState, rejectWithValue }) => {
    const state = getState() as { user: { token: string } };
    const token = state.user.token;
    try {
      const response = await fetch(`/api/exercises/${exerciseId}`, {
        method: "DELETE",
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!response.ok) throw new Error("Error al eliminar ejercicio");
      return { routineId, dayId, exerciseId };
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// Actualizar el estado de completado de un ejercicio
export const updateExerciseCompleted = createAsyncThunk(
  "routine/updateExerciseCompleted",
  async (
    { routineId, dayIndex, exerciseIndex, completed }: { routineId: string; dayIndex: number; exerciseIndex: number; completed: boolean },
    { getState, rejectWithValue }
  ) => {
    const state = getState() as { user: { token: string }; routine: RoutineState };
    const token = state.user.token;
    const exerciseId = state.routine.routines[state.routine.selectedRoutineIndex!].days[dayIndex].exercises[exerciseIndex]._id;

    try {
      const response = await fetch(`/api/exercises/${exerciseId}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ completed }),
      });
      if (!response.ok) throw new Error("Error al actualizar ejercicio");
      const updatedExercise = await response.json();
      return { routineId, dayIndex, exerciseIndex, completed: updatedExercise.completed };
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// Establecer videos para un ejercicio
export const setExerciseVideos = createAsyncThunk(
  "routine/setExerciseVideos",
  async (
    { routineId, dayIndex, exerciseIndex, videos }: { routineId: string; dayIndex: number; exerciseIndex: number; videos: { url: string; isCurrent: boolean }[] },
    { getState, rejectWithValue }
  ) => {
    const state = getState() as { user: { token: string }; routine: RoutineState };
    const token = state.user.token;
    const exerciseId = state.routine.routines[state.routine.selectedRoutineIndex!].days[dayIndex].exercises[exerciseIndex]._id;

    try {
      // Crear o actualizar videos
      const videoIds = [];
      for (const video of videos) {
        const response = await fetch("/api/videos", {
          method: "POST",
          headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
          body: JSON.stringify(video),
        });
        if (!response.ok) throw new Error("Error al crear video");
        const newVideo = await response.json();
        videoIds.push(newVideo._id);
      }

      // Actualizar el ejercicio con los nuevos videoIds
      const response = await fetch(`/api/exercises/${exerciseId}`, {
        method: "PUT",
        headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
        body: JSON.stringify({ videos: videoIds }),
      });
      if (!response.ok) throw new Error("Error al actualizar videos del ejercicio");
      const updatedExercise = await response.json();

      return { routineId, dayIndex, exerciseIndex, videos: updatedExercise.videos };
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const generateRoutine = createAsyncThunk(
  "routine/generateRoutine",
  async (input: RoutineInput, { rejectWithValue }) => {
    try {
      const response = await fetch("/api/routines/generate", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          // Añadir Authorization si usas autenticación
        },
        body: JSON.stringify(input),
      });

      if (!response.ok) throw new Error("Error al generar la rutina");
      const routine: RoutineData = await response.json();
      return routine;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

const routineSlice = createSlice({
  name: "routine",
  initialState,
  reducers: {},
  extraReducers: (builder) => {
    builder
      // Fetch Routines
      .addCase(fetchRoutines.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRoutines.fulfilled, (state, action: PayloadAction<RoutineData[]>) => {
        state.loading = false;
        state.routines = action.payload;
        state.selectedRoutineIndex = action.payload.length > 0 ? 0 : null;
      })
      .addCase(fetchRoutines.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      // Create Routine
      .addCase(createRoutine.fulfilled, (state, action: PayloadAction<RoutineData>) => {
        state.routines.push(action.payload);
        state.selectedRoutineIndex = state.routines.length - 1;
      })
      .addCase(createRoutine.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Update Routine
      .addCase(updateRoutine.fulfilled, (state, action: PayloadAction<RoutineData>) => {
        const index = state.routines.findIndex((r) => r._id === action.payload._id);
        if (index !== -1) {
          state.routines[index] = action.payload;
        }
      })
      .addCase(updateRoutine.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Delete Routine
      .addCase(deleteRoutine.fulfilled, (state, action: PayloadAction<string>) => {
        state.routines = state.routines.filter((r) => r._id !== action.payload);
        state.selectedRoutineIndex = state.routines.length > 0 ? 0 : null;
      })
      .addCase(deleteRoutine.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Select Routine
      .addCase(selectRoutine.fulfilled, (state, action: PayloadAction<number>) => {
        state.selectedRoutineIndex = action.payload;
      })
      // Create Day
      .addCase(createDay.fulfilled, (state, action: PayloadAction<{ routineId: string; day: RoutineData["days"][number] }>) => {
        const routineIndex = state.routines.findIndex((r) => r._id === action.payload.routineId);
        if (routineIndex !== -1) {
          state.routines[routineIndex].days.push(action.payload.day);
        }
      })
      .addCase(createDay.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Update Day
      .addCase(updateDay.fulfilled, (state, action: PayloadAction<{ routineId: string; dayId: string; dayName: string }>) => {
        const routineIndex = state.routines.findIndex((r) => r._id === action.payload.routineId);
        if (routineIndex !== -1) {
          const dayIndex = state.routines[routineIndex].days.findIndex((d) => d._id === action.payload.dayId);
          if (dayIndex !== -1) {
            state.routines[routineIndex].days[dayIndex].dayName = action.payload.dayName;
          }
        }
      })
      .addCase(updateDay.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Delete Day
      .addCase(deleteDay.fulfilled, (state, action: PayloadAction<{ routineId: string; dayId: string }>) => {
        const routineIndex = state.routines.findIndex((r) => r._id === action.payload.routineId);
        if (routineIndex !== -1) {
          state.routines[routineIndex].days = state.routines[routineIndex].days.filter((d) => d._id !== action.payload.dayId);
        }
      })
      .addCase(deleteDay.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Create Exercise
      .addCase(createExercise.fulfilled, (state, action: PayloadAction<{ routineId: string; dayId: string; exercise: RoutineData["days"][number]["exercises"][number] }>) => {
        const routineIndex = state.routines.findIndex((r) => r._id === action.payload.routineId);
        if (routineIndex !== -1) {
          const dayIndex = state.routines[routineIndex].days.findIndex((d) => d._id === action.payload.dayId);
          if (dayIndex !== -1) {
            state.routines[routineIndex].days[dayIndex].exercises.push(action.payload.exercise);
          }
        }
      })
      .addCase(createExercise.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Update Exercise
      .addCase(updateExercise.fulfilled, (state, action: PayloadAction<{ routineId: string; dayId: string; exerciseId: string; exercise: RoutineData["days"][number]["exercises"][number] }>) => {
        const routineIndex = state.routines.findIndex((r) => r._id === action.payload.routineId);
        if (routineIndex !== -1) {
          const dayIndex = state.routines[routineIndex].days.findIndex((d) => d._id === action.payload.dayId);
          if (dayIndex !== -1) {
            const exerciseIndex = state.routines[routineIndex].days[dayIndex].exercises.findIndex((e) => e._id === action.payload.exerciseId);
            if (exerciseIndex !== -1) {
              state.routines[routineIndex].days[dayIndex].exercises[exerciseIndex] = action.payload.exercise;
            }
          }
        }
      })
      .addCase(updateExercise.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Delete Exercise
      .addCase(deleteExercise.fulfilled, (state, action: PayloadAction<{ routineId: string; dayId: string; exerciseId: string }>) => {
        const routineIndex = state.routines.findIndex((r) => r._id === action.payload.routineId);
        if (routineIndex !== -1) {
          const dayIndex = state.routines[routineIndex].days.findIndex((d) => d._id === action.payload.dayId);
          if (dayIndex !== -1) {
            state.routines[routineIndex].days[dayIndex].exercises = state.routines[routineIndex].days[dayIndex].exercises.filter((e) => e._id !== action.payload.exerciseId);
          }
        }
      })
      .addCase(deleteExercise.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Update Exercise Completed
      .addCase(updateExerciseCompleted.fulfilled, (state, action: PayloadAction<{ routineId: string; dayIndex: number; exerciseIndex: number; completed: boolean }>) => {
        const { dayIndex, exerciseIndex, completed } = action.payload;
        if (state.selectedRoutineIndex !== null) {
          state.routines[state.selectedRoutineIndex].days[dayIndex].exercises[exerciseIndex].completed = completed;
        }
      })
      .addCase(updateExerciseCompleted.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      // Set Exercise Videos
      .addCase(setExerciseVideos.fulfilled, (state, action: PayloadAction<{ routineId: string; dayIndex: number; exerciseIndex: number; videos: { _id: string; url: string; isCurrent: boolean }[] }>) => {
        const { dayIndex, exerciseIndex, videos } = action.payload;
        if (state.selectedRoutineIndex !== null) {
          state.routines[state.selectedRoutineIndex].days[dayIndex].exercises[exerciseIndex].videos = videos;
        }
      })
      .addCase(setExerciseVideos.rejected, (state, action) => {
        state.error = action.payload as string;
      })
      .addCase(generateRoutine.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(generateRoutine.fulfilled, (state, action: PayloadAction<RoutineData>) => {
        state.loading = false;
        state.routines.push(action.payload);
      })
      .addCase(generateRoutine.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export default routineSlice.reducer;