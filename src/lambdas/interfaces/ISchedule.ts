import z from 'zod';

export const IScheduleSchema = z.object({
  date: z.string(),
  binName: z.string(),
  binColour: z.string().optional(),
  binContent: z.string().optional(),
});

export type ISchedule = z.infer<typeof IScheduleSchema>;
