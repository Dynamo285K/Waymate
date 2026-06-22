import {
    BarChart,
    Bar,
    XAxis,
    YAxis,
    Tooltip,
    ResponsiveContainer,
    CartesianGrid,
} from "recharts";
import { DashboardCard } from "./DashboardCard";

const CHART_COLOR = "var(--color-primary)";
const CHART_CURSOR_FILL =
    "color-mix(in srgb, var(--color-primary) 8%, transparent)";
const GRID_COLOR = "var(--color-border)";

/**
 * A single weekly bar chart card. Generic over the bar series so the rides and
 * revenue charts share one implementation — `dataKey` selects the numeric
 * field on each `{ day, ... }` row.
 */
export function WeeklyBarChart({
    title,
    loadingLabel,
    loading,
    data,
    dataKey,
}: {
    title: string;
    loadingLabel: string;
    loading: boolean;
    data: ReadonlyArray<Record<string, string | number>>;
    dataKey: string;
}) {
    return (
        <DashboardCard>
            <h2 className="text-base font-bold text-text-primary mb-4">
                {title}
            </h2>
            {loading ? (
                <div className="h-50 flex items-center justify-center">
                    <span className="text-sm text-text-secondary">
                        {loadingLabel}
                    </span>
                </div>
            ) : (
                <ResponsiveContainer
                    width="100%"
                    height={200}
                >
                    <BarChart
                        data={data as Record<string, string | number>[]}
                        barSize={28}
                    >
                        <CartesianGrid
                            strokeDasharray="3 3"
                            stroke={GRID_COLOR}
                            vertical={false}
                        />
                        <XAxis
                            dataKey="day"
                            axisLine={false}
                            tickLine={false}
                            tick={{
                                fontSize: 12,
                                fill: "var(--color-text-secondary)",
                            }}
                        />
                        <YAxis hide />
                        <Tooltip
                            cursor={{ fill: CHART_CURSOR_FILL }}
                            contentStyle={{
                                borderRadius: 10,
                                border: "1px solid var(--color-border)",
                                background: "var(--color-card)",
                            }}
                        />
                        <Bar
                            dataKey={dataKey}
                            fill={CHART_COLOR}
                            radius={[6, 6, 0, 0]}
                        />
                    </BarChart>
                </ResponsiveContainer>
            )}
        </DashboardCard>
    );
}
