import React from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from "recharts";

// Mock data representing different inventory risk factors
const data = [
  { subject: "Obsolescence", "Current Risk": 85, "Target Risk": 30, fullMark: 100 },
  { subject: "Demand", "Current Risk": 70, "Target Risk": 40, fullMark: 100 },
  { subject: "Supply Chain", "Current Risk": 60, "Target Risk": 25, fullMark: 100 },
  { subject: "Storage Cost", "Current Risk": 50, "Target Risk": 20, fullMark: 100 },
  { subject: "Stockout", "Current Risk": 90, "Target Risk": 35, fullMark: 100 },
];

const RiskRadarChartCard: React.FC = () => {
  return (
    <Card className="bg-card border-border rounded-lg shadow-sm p-4">
      <CardHeader className="pb-2">
        <CardTitle className="text-2xl font-bold text-foreground">Risk</CardTitle> {/* Updated title to 'Risk' */}
        <p className="text-sm text-muted-foreground">Inventory Risk Profile</p> {/* Updated subtitle */}
      </CardHeader>
      <CardContent className="h-[257px] p-4 pt-0 flex flex-col justify-between relative">
        <ResponsiveContainer width="100%" height="100%">
          <RadarChart cx="50%" cy="50%" outerRadius="70%" data={data}> {/* Adjusted outerRadius to 70% */}
            <PolarGrid stroke="hsl(var(--muted))" strokeOpacity={0.5} />
            <PolarAngleAxis dataKey="subject" tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
            <PolarRadiusAxis angle={90} domain={[0, 100]} tick={false} axisLine={false} /> {/* Scale from 0 to 100 */}
            {/* Current Risk (Red) */}
            <Radar name="Current Risk" dataKey="Current Risk" stroke="#FF4D4D" fill="#FF4D4D" fillOpacity={0.6} />
            {/* Target Risk (Green) */}
            <Radar name="Target Risk" dataKey="Target Risk" stroke="#00C49F" fill="#00C49F" fillOpacity={0.6} />
          </RadarChart>
        </ResponsiveContainer>
        {/* Removed the small circle indicator */}
      </CardContent>
    </Card>
  );
};

export default RiskRadarChartCard;