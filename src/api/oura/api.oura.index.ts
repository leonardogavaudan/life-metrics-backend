import { AxiosInstance, AxiosResponse } from "axios";

export interface OuraGetDailySleepResponse {
  data: {
    id: string;
    contributors: {
      deep_sleep: number;
      efficiency: number;
      latency: number;
      rem_sleep: number;
      restfulness: number;
      timing: number;
      total_sleep: number;
    };
    day: string;
    score: number;
    timestamp: string;
  }[];
  next_token: string | null;
}

export async function getDailySleep(
  client: AxiosInstance,
  startDate: Date,
  endDate: Date
): Promise<AxiosResponse<OuraGetDailySleepResponse>> {
  return await client.get("/usercollection/daily_sleep", {
    params: {
      start_date: startDate.toISOString().split("T")[0],
      end_date: endDate.toISOString().split("T")[0],
    },
  });
}
