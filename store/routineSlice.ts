import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import {dbConnect} from "../lib/mongodb";
import Routine from "../models/routines";

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

// Thunk para obtener rutinas desde MongoDB
export const fetchRoutines = createAsyncThunk(
  "routine/fetchRoutines",
  async (userId: string, { rejectWithValue }) => {
    try {
      await dbConnect();
      const routines = await Routine.find({ userId }).lean();
      return routines as unknown as Routine[];
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// Thunk para actualizar el estado "completed" de un ejercicio
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
      await dbConnect();
      const updatePath = `days.${dayIndex}.exercises.${exerciseIndex}.completed`;
      const routine = await Routine.findByIdAndUpdate(
        routineId,
        { $set: { [updatePath]: completed } },
        { new: true }
      ).lean();
      return routine as unknown as Routine;
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
      });
  },
});

export const { setRoutines, selectRoutine } = routineSlice.actions;
export default routineSlice.reducer;