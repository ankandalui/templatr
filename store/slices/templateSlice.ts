import { createSlice, createAsyncThunk } from "@reduxjs/toolkit";

export interface Template {
  id: string;
  name: string;
  description?: string;
  backgroundUrl?: string;
  backgroundImage?: {
    id: string;
    name: string;
    imageUrl: string;
  };
  questionUrl?: string;
  thumbnailUrl?: string;
  downloadCount: number;
  viewCount: number;
  isActive: boolean;
  userId: string;
  folderId?: string;
  folderName?: string;
  createdAt: string;
  updatedAt: string;
}

export interface TemplateState {
  templates: Template[];
  recentTemplates: Template[];
  isLoading: boolean;
  error: string | null;
  createLoading: boolean;
  updateLoading: boolean;
  deleteLoading: boolean;
  stats: {
    totalTemplates: number;
    totalDownloads: number;
    totalViews: number;
    totalImages: number;
  };
}

const initialState: TemplateState = {
  templates: [],
  recentTemplates: [],
  isLoading: false,
  error: null,
  createLoading: false,
  updateLoading: false,
  deleteLoading: false,
  stats: {
    totalTemplates: 0,
    totalDownloads: 0,
    totalViews: 0,
    totalImages: 0,
  },
};

// Async thunks
export const fetchTemplates = createAsyncThunk(
  "templates/fetchTemplates",
  async (folderId?: string, { rejectWithValue }) => {
    try {
      const url = folderId
        ? `/api/templates?folderId=${folderId}`
        : "/api/templates";
      const response = await fetch(url, {
        credentials: "include",
      });

      if (!response.ok) {
        return rejectWithValue("Failed to fetch templates");
      }

      const data = await response.json();
      return data.templates;
    } catch (error) {
      return rejectWithValue("Network error");
    }
  }
);

export const fetchRecentTemplates = createAsyncThunk(
  "templates/fetchRecentTemplates",
  async (limit: number = 6, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/templates/recent?limit=${limit}`, {
        credentials: "include",
      });

      if (!response.ok) {
        return rejectWithValue("Failed to fetch recent templates");
      }

      const data = await response.json();
      return data.templates;
    } catch (error) {
      return rejectWithValue("Network error");
    }
  }
);

export const fetchTemplateStats = createAsyncThunk(
  "templates/fetchStats",
  async (_, { rejectWithValue }) => {
    try {
      const response = await fetch("/api/templates/stats", {
        credentials: "include",
      });

      if (!response.ok) {
        return rejectWithValue("Failed to fetch template stats");
      }

      const data = await response.json();
      return data.stats;
    } catch (error) {
      return rejectWithValue("Network error");
    }
  }
);

export const createTemplate = createAsyncThunk(
  "templates/createTemplate",
  async (
    templateData: {
      name: string;
      description?: string;
      folderId?: string;
      backgroundUrl?: string;
      questionUrl?: string;
    },
    { rejectWithValue }
  ) => {
    try {
      const response = await fetch("/api/templates", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(templateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.error || "Failed to create template");
      }

      const data = await response.json();
      return data.template;
    } catch (error) {
      return rejectWithValue("Network error");
    }
  }
);

export const updateTemplate = createAsyncThunk(
  "templates/updateTemplate",
  async (
    {
      id,
      ...updateData
    }: { id: string; name?: string; description?: string; folderId?: string },
    { rejectWithValue }
  ) => {
    try {
      const response = await fetch(`/api/templates/${id}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
        },
        credentials: "include",
        body: JSON.stringify(updateData),
      });

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.error || "Failed to update template");
      }

      const data = await response.json();
      return data.template;
    } catch (error) {
      return rejectWithValue("Network error");
    }
  }
);

export const deleteTemplate = createAsyncThunk(
  "templates/deleteTemplate",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/templates/${id}`, {
        method: "DELETE",
        credentials: "include",
      });

      if (!response.ok) {
        const errorData = await response.json();
        return rejectWithValue(errorData.error || "Failed to delete template");
      }

      return id;
    } catch (error) {
      return rejectWithValue("Network error");
    }
  }
);

export const incrementDownload = createAsyncThunk(
  "templates/incrementDownload",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/templates/${id}/download`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        return rejectWithValue("Failed to increment download count");
      }

      const data = await response.json();
      return data.template;
    } catch (error) {
      return rejectWithValue("Network error");
    }
  }
);

export const incrementView = createAsyncThunk(
  "templates/incrementView",
  async (id: string, { rejectWithValue }) => {
    try {
      const response = await fetch(`/api/templates/${id}/view`, {
        method: "POST",
        credentials: "include",
      });

      if (!response.ok) {
        return rejectWithValue("Failed to increment view count");
      }

      const data = await response.json();
      return data.template;
    } catch (error) {
      return rejectWithValue("Network error");
    }
  }
);

const templateSlice = createSlice({
  name: "templates",
  initialState,
  reducers: {
    clearError: (state) => {
      state.error = null;
    },
  },
  extraReducers: (builder) => {
    // Fetch templates
    builder
      .addCase(fetchTemplates.pending, (state) => {
        state.isLoading = true;
        state.error = null;
      })
      .addCase(fetchTemplates.fulfilled, (state, action) => {
        state.isLoading = false;
        state.templates = action.payload;
      })
      .addCase(fetchTemplates.rejected, (state, action) => {
        state.isLoading = false;
        state.error = action.payload as string;
      });

    // Fetch recent templates
    builder.addCase(fetchRecentTemplates.fulfilled, (state, action) => {
      state.recentTemplates = action.payload;
    });

    // Fetch stats
    builder.addCase(fetchTemplateStats.fulfilled, (state, action) => {
      state.stats = action.payload;
    });

    // Create template
    builder
      .addCase(createTemplate.pending, (state) => {
        state.createLoading = true;
        state.error = null;
      })
      .addCase(createTemplate.fulfilled, (state, action) => {
        state.createLoading = false;
        state.templates.push(action.payload);
        state.recentTemplates.unshift(action.payload);
        if (state.recentTemplates.length > 6) {
          state.recentTemplates.pop();
        }
      })
      .addCase(createTemplate.rejected, (state, action) => {
        state.createLoading = false;
        state.error = action.payload as string;
      });

    // Update template
    builder
      .addCase(updateTemplate.pending, (state) => {
        state.updateLoading = true;
        state.error = null;
      })
      .addCase(updateTemplate.fulfilled, (state, action) => {
        state.updateLoading = false;
        const index = state.templates.findIndex(
          (t) => t.id === action.payload.id
        );
        if (index !== -1) {
          state.templates[index] = action.payload;
        }
        const recentIndex = state.recentTemplates.findIndex(
          (t) => t.id === action.payload.id
        );
        if (recentIndex !== -1) {
          state.recentTemplates[recentIndex] = action.payload;
        }
      })
      .addCase(updateTemplate.rejected, (state, action) => {
        state.updateLoading = false;
        state.error = action.payload as string;
      });

    // Delete template
    builder
      .addCase(deleteTemplate.pending, (state) => {
        state.deleteLoading = true;
        state.error = null;
      })
      .addCase(deleteTemplate.fulfilled, (state, action) => {
        state.deleteLoading = false;
        state.templates = state.templates.filter(
          (t) => t.id !== action.payload
        );
        state.recentTemplates = state.recentTemplates.filter(
          (t) => t.id !== action.payload
        );
      })
      .addCase(deleteTemplate.rejected, (state, action) => {
        state.deleteLoading = false;
        state.error = action.payload as string;
      });

    // Increment download
    builder.addCase(incrementDownload.fulfilled, (state, action) => {
      const template = state.templates.find((t) => t.id === action.payload.id);
      if (template) {
        template.downloadCount = action.payload.downloadCount;
      }
      const recentTemplate = state.recentTemplates.find(
        (t) => t.id === action.payload.id
      );
      if (recentTemplate) {
        recentTemplate.downloadCount = action.payload.downloadCount;
      }
    });

    // Increment view
    builder.addCase(incrementView.fulfilled, (state, action) => {
      const template = state.templates.find((t) => t.id === action.payload.id);
      if (template) {
        template.viewCount = action.payload.viewCount;
      }
      const recentTemplate = state.recentTemplates.find(
        (t) => t.id === action.payload.id
      );
      if (recentTemplate) {
        recentTemplate.viewCount = action.payload.viewCount;
      }
    });
  },
});

export const { clearError } = templateSlice.actions;
export default templateSlice.reducer;
