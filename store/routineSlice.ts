import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";

interface Routine {
  _id: string;
  userId: string;
  name: string;
  days: {
    dayName: string;
    musclesWorked: string[];
    warmupOptions: string[];
    explanation: string;
    exercises: {
      name: string;
      muscleGroup: string;
      sets: number;
      reps: number;
      weight: string;
      rest: string;
      tips: string[];
      completed: boolean;
      videos: { url: string; isCurrent: boolean }[];
    }[];
  }[];
  createdAt: string;
  updatedAt: string;
}

interface RoutineState {
  routines: Routine[];
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

export const fetchRoutines = createAsyncThunk(
  "routine/fetchRoutines",
  async (_: void, { rejectWithValue }) => {
    try {
      const response = await fetch("/api/routines", {
        method: "GET",
        credentials: "include", // Para enviar cookies
      });
      if (!response.ok) throw new Error((await response.json()).message);
      return (await response.json()) as Routine[];
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const updateExerciseCompleted = createAsyncThunk(
  "routine/updateExerciseCompleted",
  async (
    { routineId, dayIndex, exerciseIndex, completed }: {
      routineId: string;
      dayIndex: number;
      exerciseIndex: number;
      completed: boolean;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await fetch("/api/routines", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ routineId, dayIndex, exerciseIndex, completed }),
      });
      if (!response.ok) throw new Error((await response.json()).message);
      return (await response.json()) as Routine;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const addRoutine = createAsyncThunk(
  "routine/addRoutine",
  async (routineData: Omit<Routine, "_id" | "createdAt" | "updatedAt">, { rejectWithValue }) => {
    try {
      const response = await fetch("/api/routines", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(routineData),
      });
      if (!response.ok) throw new Error((await response.json()).message);
      return (await response.json()) as Routine;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

const routineSlice = createSlice({
  name: "routine",
  initialState,
  reducers: {
    setRoutines(state, action: PayloadAction<Routine[]>) {
      state.routines = action.payload;
    },
    selectRoutine(state, action: PayloadAction<number>) {
      state.selectedRoutineIndex = action.payload;
    },
    logout(state) {
      state.routines = [];
      state.selectedRoutineIndex = null;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchRoutines.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchRoutines.fulfilled, (state, action: PayloadAction<Routine[]>) => {
        state.loading = false;
        state.routines = action.payload;
        state.selectedRoutineIndex = action.payload.length > 0 ? 0 : null;
      })
      .addCase(fetchRoutines.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(updateExerciseCompleted.fulfilled, (state, action: PayloadAction<Routine>) => {
        const updatedRoutine = action.payload;
        const index = state.routines.findIndex((r) => r._id === updatedRoutine._id);
        if (index !== -1) {
          state.routines[index] = updatedRoutine;
        }
      })
      .addCase(addRoutine.fulfilled, (state, action: PayloadAction<Routine>) => {
        state.routines.push(action.payload);
        state.selectedRoutineIndex = state.routines.length - 1;
      });
  },
});

export const { setRoutines, selectRoutine, logout } = routineSlice.actions;
export default routineSlice.reducer;