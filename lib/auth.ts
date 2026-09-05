import api from "@/lib/api";

export async function checkAuth(): Promise<boolean> {
  try {
    await api.get("/kits");
    return true;
  } catch (error: any) {
    if (error?.response?.status === 401) {
      return false;
    }

    throw error;
  }
}