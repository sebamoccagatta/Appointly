import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import {
    fetchMySchedule,
    upsertMySchedule,
    type ScheduleDTO,
    type WeeklyItem,
    type ExceptionItem,
} from "../../../services/api/apiSchedule";

const SCHEDULE_KEY = ["schedule", "me"] as const;

export function useMySchedule() {
    return useQuery<ScheduleDTO>({
        queryKey: SCHEDULE_KEY,
        queryFn: fetchMySchedule,
    });
}

export function useUpdateMySchedule() {
    const qc = useQueryClient();
    return useMutation({
        mutationFn: (input: {
            timezone: string;
            bufferMinutes: number;
            weeklyTemplate: WeeklyItem[];
            exceptions?: ExceptionItem[];
        }) => upsertMySchedule(input),
        onSuccess: () => {
            qc.invalidateQueries({ queryKey: SCHEDULE_KEY });
        },
    });
}