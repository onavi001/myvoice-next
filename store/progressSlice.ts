import { createSlice, PayloadAction, createAsyncThunk } from "@reduxjs/toolkit";

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

export const fetchProgress = createAsyncThunk(
  "progress/fetchProgress",
  async (_: void, { rejectWithValue }) => {
    try {
      const response = await fetch("/api/progress", {
        method: "GET",
        credentials: "include", // Enviar cookies con el token
      });
      if (!response.ok) throw new Error((await response.json()).message);
      return (await response.json()) as ProgressEntry[];
    } catch (error) {
      return rejectWithValue((error as Error).message);
    }
  }
);

export const addProgressEntry = createAsyncThunk(
  "progress/addProgressEntry",
  async (progressData: Omit<ProgressEntry, "_id" | "date">, { rejectWithValue }) => {
    try {
      const response = await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify(progressData),
      });
      if (!response.ok) throw new Error((await response.json()).message);
      return (await response.json()) as ProgressEntry;
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
      .addCase(addProgressEntry.pending, (state) => {
        state.loading = true;
        state.error = null;
      })
      .addCase(addProgressEntry.fulfilled, (state, action: PayloadAction<ProgressEntry>) => {
        state.loading = false;
        state.progress.push(action.payload);
      })
      .addCase(addProgressEntry.rejected, (state, action) => {
        state.loading = false;
        state.error = action.payload as string;
      });
  },
});

export const { setProgress } = progressSlice.actions;
export default progressSlice.reducer;