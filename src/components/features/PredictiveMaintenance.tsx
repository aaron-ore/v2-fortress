import React, { useState } from "react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { Gauge, Wrench, Calendar, AlertTriangle, CheckCircle, Clock } from "lucide-react";
import { showSuccess } from "@/utils/toast";
import { cn } from "@/lib/utils";
import { ResponsiveContainer, LineChart, Line, XAxis, YAxis, Tooltip, CartesianGrid } from "recharts";

interface EquipmentStatus {
  id: string;
  name: string;
  location: string;
  status: "Healthy" | "Warning" | "Critical";
  lastMaintenance: string;
  nextPredictedMaintenance: string;
  sensorData: { name: string; value: number }[];
}

const mockEquipment: EquipmentStatus[] = [
  {
    id: "eq-1",
    name: "Forklift F-200",
    location: "Main Warehouse",
    status: "Warning",
    lastMaintenance: "2024-06-01",
    nextPredictedMaintenance: "2024-09-15",
    sensorData: [
      { name: "Mon", value: 70 }, { name: "Tue", value: 72 }, { name: "Wed", value: 75 },
      { name: "Thu", value: 80 }, { name: "Fri", value: 85 }, { name: "Sat", value: 88 },
      { name: "Sun", value: 92 }
    ],
  },
  {
    id: "eq-2",
    name: "Conveyor Belt C-50",
    location: "Shipping Area",
    status: "Healthy",
    lastMaintenance: "2024-07-10",
    nextPredictedMaintenance: "2024-11-01",
    sensorData: [
      { name: "Mon", value: 40 }, { name: "Tue", value: 42 }, { name: "Wed", value: 38 },
      { name: "Thu", value: 45 }, { name: "Fri", value: 41 }, { name: "Sat", value: 43 },
      { name: "Sun", value: 39 }
    ],
  },
  {
    id: "eq-3",
    name: "Pallet Jack PJ-10",
    location: "Receiving Dock",
    status: "Critical",
    lastMaintenance: "2024-05-01",
    nextPredictedMaintenance: "2024-08-20",
    sensorData: [
      { name: "Mon", value: 95 }, { name: "Tue", value: 98 }, { name: "Wed", value: 102 },
      { name: "Thu", value: 105 }, { name: "Fri", value: 110 }, { name: "Sat", value: 115 },
      { name: "Sun", value: 120 }
    ],
  },
];

const PredictiveMaintenance: React.FC = () => {
  const handleScheduleMaintenance = (equipmentName: string) => {
    showSuccess(`Maintenance scheduled for ${equipmentName}!`);
  };

  const getStatusColor = (status: EquipmentStatus['status']) => {
    switch (status) {
      case "Healthy": return "text-green-500";
      case "Warning": return "text-yellow-500";
      case "Critical": return "text-destructive";
      default: return "text-muted-foreground";
    }
  };

  const getLineColor = (status: EquipmentStatus['status']) => {
    switch (status) {
      case "Healthy": return "hsl(142.1 76.2% 36.3%)"; // Green
      case "Warning": return "hsl(47.9 95.8% 53.1%)";  // Yellow
      case "Critical": return "hsl(0 80% 60%)";       // Red
      default: return "hsl(var(--muted-foreground))";
    }
  };

  return (
    <div className="space-y-6">
      <p className="text-muted-foreground">
        Monitor the health of your warehouse equipment and predict maintenance needs before failures occur.
      </p>

      <div className="grid gap-6 md:grid-cols-1 lg:grid-cols-2">
        {mockEquipment.map((equipment) => (
          <Card key={equipment.id} className="bg-card border-border rounded-lg shadow-sm">
            <CardHeader className="pb-4">
              <CardTitle className="text-xl font-semibold flex items-center gap-2">
                <Wrench className="h-6 w-6 text-primary" /> {equipment.name}
              </CardTitle>
              <p className="text-sm text-muted-foreground">{equipment.location}</p>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1">
                  <Gauge className="h-4 w-4 text-muted-foreground" /> Status:
                </span>
                <span className={cn("font-semibold", getStatusColor(equipment.status))}>
                  {equipment.status}
                </span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1">
                  <Calendar className="h-4 w-4 text-muted-foreground" /> Last Maintenance:
                </span>
                <span>{equipment.lastMaintenance}</span>
              </div>
              <div className="flex items-center justify-between text-sm">
                <span className="flex items-center gap-1">
                  <Clock className="h-4 w-4 text-muted-foreground" /> Predicted Next:
                </span>
                <span className={cn("font-semibold", equipment.status === "Critical" ? "text-destructive" : "")}>
                  {equipment.nextPredictedMaintenance}
                </span>
              </div>

              <div className="h-40 w-full">
                <h4 className="text-sm font-semibold mb-2">Sensor Data Trend:</h4>
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={equipment.sensorData} margin={{ top: 5, right: 10, left: 0, bottom: 5 }}>
                    <CartesianGrid strokeDasharray="3 3" stroke="hsl(var(--muted))" strokeOpacity={0.3} />
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{ fill: 'hsl(var(--muted-foreground))', fontSize: 10 }} />
                    <YAxis hide domain={[0, 120]} />
                    <Tooltip
                      contentStyle={{
                        backgroundColor: "hsl(var(--card))",
                        borderColor: "hsl(var(--border))",
                        borderRadius: "0.5rem",
                        fontSize: "0.75rem",
                      }}
                      itemStyle={{ color: "hsl(var(--foreground))", fontSize: "0.75rem" }}
                      labelStyle={{ color: "hsl(var(--muted-foreground))", fontSize: "0.75rem" }}
                    />
                    <Line type="monotone" dataKey="value" stroke={getLineColor(equipment.status)} strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>

              <Button onClick={() => handleScheduleMaintenance(equipment.name)} className="w-full">
                Schedule Maintenance
              </Button>
            </CardContent>
          </Card>
        ))}
      </div>

      <Card className="bg-card border-border rounded-lg shadow-sm p-6 mt-8">
        <CardHeader className="pb-4">
          <CardTitle className="text-xl font-semibold">
            Architectural Notes & Future Refactoring
          </CardTitle>
        </CardHeader>
        <CardContent className="space-y-4 text-muted-foreground text-sm">
          <p>
            This `PredictiveMaintenance` component is a "spike" implementation.
            The "AI" logic and data are currently simulated.
            For a production system, this would involve:
          </p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>
              **IoT Integration:** Real-time sensor data from equipment (e.g., vibration, temperature, runtime hours).
            </li>
            <li>
              **Machine Learning Models:** Models trained on historical sensor data and maintenance logs to predict failures.
            </li>
            <li>
              **Automated Workflows:** Integration with maintenance scheduling systems to automatically create work orders.
            </li>
            <li>
              **Alerting:** Proactive notifications for critical equipment health.
            </li>
          </ul>
          <p>
            **Testing Considerations:**
            Unit tests for this component would focus on:
          </p>
          <ul className="list-disc list-inside ml-4 space-y-1">
            <li>
              `getStatusColor` and `getLineColor`: Verify correct color output for different statuses.
            </li>
            <li>
              UI rendering: Ensure equipment cards display correctly with mock data, and buttons trigger expected actions.
            </li>
          </ul>
        </CardContent>
      </Card>
    </div>
  );
};

export default PredictiveMaintenance;