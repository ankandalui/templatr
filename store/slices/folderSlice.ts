import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

export interface Folder {
  id: string;
  name: string;
  description?: string;
  color: string;
  userId: string;
  templateCount: number;
  createdAt: string;
  updatedAt: string;
}

export interface FolderState {
  folders: Folder[];
  isLoading: boolean;
  error: string | null;
  createLoading: boolean;
  updateLoading: boolean;
  deleteLoading: boolean;
}

const initialState: FolderState = {
  folders: [],
  isLoading: false,
  error: null,
  createLoading: false,
  updateLoading: false,
  deleteLoading: false,
};

// Async thunks
export const fetchFolders = createAsyncThunk(
  "folders/fetchFolders",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch("/api/folders", {
        credentials: "include",
      });

      if (!response.ok) {
        return rejectWithValue("Failed to fetch folders");
      }

      const data = await response.json();
      return data.folders;
    } catch (error) {
      return rejectWithValue("Network error");
    }
  }
);

export const createFolder = createAsyncThunk(
  "folders/createFolder",
  async (
    folderData: { name: string; description?: string; color?: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await fetch("/api/folders", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(folderData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.error || "Failed to create folder");
      }

      const data = await response.json();
      return data.folder;
    } catch (error) {
      return rejectWithValue("Network error");
    }
  }
);

export const updateFolder = createAsyncThunk(
  "folders/updateFolder",
  async (
    {
      id,
      ...updateData
    }: { id: string; name?: string; description?: string; color?: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await fetch(`/api/folders/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.error || "Failed to update folder");
      }

      const data = await response.json();
      return data.folder;
    } catch (error) {
      return rejectWithValue("Network error");
    }
  }
);

export const deleteFolder = createAsyncThunk(
  "folders/deleteFolder",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/folders/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.error || "Failed to delete folder");
      }

      const data = await response.json();
      return { id, ...data };
    } catch (error) {
      return rejectWithValue("Network error");
    }
  }
);

const folderSlice = createSlice({
  name: "folders",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch folders
    builder
      .addCase(fetchFolders.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchFolders.fulfilled, (state, action) => {
        state.isLoading = false;
        state.folders = action.payload;
      })
      .addCase(fetchFolders.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Create folder
    builder
      .addCase(createFolder.pending, (state) => {
        state.createLoading = true;
        state.error = null;
      })
      .addCase(createFolder.fulfilled, (state, action) => {
        state.createLoading = false;
        state.folders.push(action.payload);
      })
      .addCase(createFolder.rejected, (state, action) => {
        state.createLoading = false;
        state.error = action.payload as string;
      });

    // Update folder
    builder
      .addCase(updateFolder.pending, (state) => {
        state.updateLoading = true;
        state.error = null;
      })
      .addCase(updateFolder.fulfilled, (state, action) => {
        state.updateLoading = false;
        const index = state.folders.findIndex(
          (f) => f.id === action.payload.id
        );
        if (index !== -1) {
          state.folders[index] = action.payload;
        }
      })
      .addCase(updateFolder.rejected, (state, action) => {
        state.updateLoading = false;
        state.error = action.payload as string;
      });

    // Delete folder
    builder
      .addCase(deleteFolder.pending, (state) => {
        state.deleteLoading = true;
        state.error = null;
      })
      .addCase(deleteFolder.fulfilled, (state, action) => {
        state.deleteLoading = false;
        state.folders = state.folders.filter((f) => f.id !== action.payload.id);
      })
      .addCase(deleteFolder.rejected, (state, action) => {
        state.deleteLoading = false;
        state.error = action.payload as string;
      });
  },
});

export const { clearError } = folderSlice.actions;
export default folderSlice.reducer;
