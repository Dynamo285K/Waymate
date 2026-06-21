import { z } from "zod";
import { reportStatusValues, reportTypeValues } from "./status-values";
import { UserIdSchema } from "./user.schema";
import { RideIdSchema } from "./ride.schema";

// ==========================================
// 0. PRIMITIVES
// ==========================================
export const ReportIdSchema = z.uuid();
export type ReportId = z.infer<typeof ReportIdSchema>;

export const ReportTypeSchema = z.enum(reportTypeValues);
export type ReportType = z.infer<typeof ReportTypeSchema>;

export const ReportStatusSchema = z.enum(reportStatusValues);
export type ReportStatus = z.infer<typeof ReportStatusSchema>;

const DescriptionSchema = z.string().trim().min(1).max(2000);

// ==========================================
// 1. URL PARAMETERS
// ==========================================
export const ReportIdParamsSchema = z.object({
    id: z.uuid("Invalid report ID"),
});

// ==========================================
// 2. REQUEST BODIES (Inputs from frontend)
// ==========================================
export const CreateReportBodySchema = z
    .object({
        targetUserId: UserIdSchema,
        rideId: RideIdSchema.optional(),
        reportType: ReportTypeSchema,
        description: DescriptionSchema,
        // When true, also adds the target to the reporter's personal block list
        // (no more chat / bookings / search visibility between the two).
        blockTarget: z.boolean().optional(),
    })
    .strict();

// ==========================================
// 3. RESPONSE SCHEMAS (Outputs for Swagger)
// ==========================================
export const ReportActionResponseSchema = z.object({
    id: ReportIdSchema,
    reportStatus: ReportStatusSchema,
});

// ==========================================
// 4. INFERRED TYPES
// ==========================================
export type CreateReportBody = z.infer<typeof CreateReportBodySchema>;
export type ReportIdParams = z.infer<typeof ReportIdParamsSchema>;
