import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";
import {dbConnect} from "../lib/mongodb";
import Progress from "../models/progress";

interface ProgressEntry {
  _id: string;
  userId: string;
  routineId: string;
  dayId: string;
  exerciseId: string;
  sets: number;
  reps: number;
  weight: string;
  notes: string;
  date: string;
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

// Thunk para obtener progreso desde MongoDB
export const fetchProgress = createAsyncThunk(
  "progress/fetchProgress",
  async (userId: string, { rejectWithValue }) => {
    try {
      await dbConnect();
      const progress = await Progress.find({ userId }).lean();
      return progress as unknown as ProgressEntry[];
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

// Thunk para agregar un nuevo progreso
export const addProgressEntry = createAsyncThunk(
  "progress/addProgressEntry",
  async (progressData: Omit<ProgressEntry, "_id">, { rejectWithValue }) => {
    try {
      await dbConnect();
      const progress = await Progress.create(progressData);
      return progress as unknown as ProgressEntry;
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

const progressSlice = createSlice({
  name: "progress",
  initialState,
  reducers: {
    setProgress(state, action: PayloadAction<ProgressEntry[]>) {
      state.progress = action.payload;
    },
  },
  extraReducers: (builder) => {
    builder
      .addCase(fetchProgress.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(fetchProgress.fulfilled, (state, action: PayloadAction<ProgressEntry[]>) => {
        state.loading = false;
        state.progress = action.payload;
      })
      .addCase(fetchProgress.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      })
      .addCase(addProgressEntry.fulfilled, (state, action: PayloadAction<ProgressEntry>) => {
        state.progress.push(action.payload);
      });
  },
});

export const { setProgress } = progressSlice.actions;
export default progressSlice.reducer;