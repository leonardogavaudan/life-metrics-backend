import { AxiosInstance, AxiosResponse } from "axios";
import { format } from "date-fns";

export interface OuraGetSleepSessionsResponse {
  data: {
    id: string;
    average_breath: number;
    average_heart_rate: number;
    average_hrv: number;
    awake_time: number;
    bedtime_end: string;
    bedtime_start: string;
    day: string;
    deep_sleep_duration: number;
    efficiency: number;
    heart_rate: {
      interval: number;
      items: number[];
      timestamp: string;
    };
    hrv: {
      interval: number;
      items: number[];
      timestamp: string;
    };
    latency: number;
    light_sleep_duration: number;
    low_battery_alert: boolean;
    lowest_heart_rate: number;
    movement_30_sec: string;
    period: number;
    readiness: {
      contributors: {
        activity_balance: number;
        body_temperature: number;
        hrv_balance: number;
        previous_day_activity: number;
        previous_night: number;
        recovery_index: number;
        resting_heart_rate: number;
        sleep_balance: number;
      };
      score: number;
      temperature_deviation: number;
      temperature_trend_deviation: number;
    };
    readiness_score_delta: number;
    rem_sleep_duration: number;
    restless_periods: number;
    sleep_phase_5_min: string;
    sleep_score_delta: number;
    sleep_algorithm_version: string;
    time_in_bed: number;
    total_sleep_duration: number; // in seconds
    type: string;
  }[];
  next_token: string;
}

export async function getSleepSessions(
  client: AxiosInstance,
  startDate: Date,
  endDate: Date,
): Promise<AxiosResponse<OuraGetSleepSessionsResponse>> {
  return await client.get("/usercollection/sleep", {
    params: {
      start_date: format(startDate, "yyyy-MM-dd"),
      end_date: format(endDate, "yyyy-MM-dd"),
    },
  });
}

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
