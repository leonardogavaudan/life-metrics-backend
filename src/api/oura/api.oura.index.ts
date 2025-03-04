import { AxiosInstance, AxiosResponse } from "axios";
import { format } from "date-fns";

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
  endDate: Date,
): Promise<AxiosResponse<OuraGetDailySleepResponse>> {
  return await client.get("/usercollection/daily_sleep", {
    params: {
      start_date: format(startDate, "yyyy-MM-dd"),
      end_date: format(endDate, "yyyy-MM-dd"),
    },
  });
}

export interface OuraGetDailyActivityResponse {
  data: {
    id: string;
    class_5_min: string;
    score: number;
    active_calories: number;
    average_met_minutes: number;
    contributors: {
      meet_daily_targets: number;
      move_every_hour: number;
      recovery_time: number;
      stay_active: number;
      training_frequency: number;
      training_volume: number;
    };
    equivalent_walking_distance: number;
    high_activity_met_minutes: number;
    high_activity_time: number;
    inactivity_alerts: number;
    low_activity_met_minutes: number;
    low_activity_time: number;
    medium_activity_met_minutes: number;
    medium_activity_time: number;
    met: {
      interval: number;
      items: number[];
      timestamp: string;
    };
    meters_to_target: number;
    non_wear_time: number;
    resting_time: number;
    sedentary_met_minutes: number;
    sedentary_time: number;
    steps: number;
    target_calories: number;
    target_meters: number;
    total_calories: number;
    day: string;
    timestamp: string;
  }[];
  next_token: string | null;
}

export async function getDailyActivity(
  client: AxiosInstance,
  startDate: Date,
  endDate: Date,
): Promise<AxiosResponse<OuraGetDailyActivityResponse>> {
  return await client.get("/usercollection/daily_activity", {
    params: {
      start_date: format(startDate, "yyyy-MM-dd"),
      end_date: format(endDate, "yyyy-MM-dd"),
    },
  });
}
