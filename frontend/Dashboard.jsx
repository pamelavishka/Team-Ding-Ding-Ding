import { useEffect, useMemo, useState } from "react";
import { io } from "socket.io-client";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  BarChart,
  Bar,
} from "recharts";

const socket = io("http://localhost:3001");

function MetricCard({ title, value, subtitle }) {
  return (
    <div className="card metric-card">
      <div>
        <p className="metric-title">{title}</p>
        <p className="metric-value">{value}</p>
        <p className="metric-subtitle">{subtitle}</p>
      </div>
    </div>
  );
}

function TabButton({ active, onClick, children }) {
  return (
    <button
      className={`tab-button ${active ? "tab-button-active" : ""}`}
      onClick={onClick}
    >
      {children}
    </button>
  );
}

function Badge({ children, secondary = false }) {
  return (
    <span className={`badge ${secondary ? "badge-secondary" : "badge-primary"}`}>
      {children}
    </span>
  );
}

function ProgressBar({ value }) {
  return (
    <div className="progress-track">
      <div className="progress-fill" style={{ width: `${value}%` }} />
    </div>
  );
}

function PaddleFace({ selectedZone, setSelectedZone }) {
  const zones = [
    { name: "upper", label: "Upper", top: "15%", left: "35%", width: "30%", height: "14%" },
    { name: "left_edge", label: "Left Edge", top: "36%", left: "18%", width: "18%", height: "22%" },
    { name: "center", label: "Center", top: "34%", left: "36%", width: "28%", height: "24%" },
    { name: "right_edge", label: "Right Edge", top: "36%", left: "64%", width: "18%", height: "22%" },
    { name: "lower", label: "Lower", top: "61%", left: "35%", width: "30%", height: "14%" },
  ];

  return (
    <div className="card">
      <div className="card-header">
        <h2>Paddle Contact Map</h2>
      </div>

      <div className="card-body paddle-layout">
        <div className="paddle-shell">
          {zones.map((zone) => (
            <button
              key={zone.name}
              onClick={() => setSelectedZone(zone.name)}
              className={`paddle-zone ${selectedZone === zone.name ? "paddle-zone-active" : ""}`}
              style={{
                top: zone.top,
                left: zone.left,
                width: zone.width,
                height: zone.height,
              }}
            >
              {zone.label}
            </button>
          ))}
          <div className="paddle-handle" />
        </div>

        <div className="zone-panel">
          <div className="zone-badge-row">
            <Badge secondary>Selected Zone</Badge>
            <span className="zone-name">{selectedZone}</span>
          </div>

          <div className="zone-stats-box">
            <div className="zone-stat">
              <div className="zone-stat-row">
                <span>Hit frequency</span>
                <span>84%</span>
              </div>
              <ProgressBar value={84} />
            </div>

            <div className="zone-stat">
              <div className="zone-stat-row">
                <span>Shot quality</span>
                <span>79%</span>
              </div>
              <ProgressBar value={79} />
            </div>

            <div className="zone-stat">
              <div className="zone-stat-row">
                <span>Consistency</span>
                <span>72%</span>
              </div>
              <ProgressBar value={72} />
            </div>
          </div>

          <p className="muted-text">
            This area lights up in real time when the backend sends new impact-location data.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("performance");

  const [liveData, setLiveData] = useState({
    heartRate: 92,
    calories: 186,
    swingSpeed: 37,
    swingForce: 74,
    hitLocation: "center",
    accuracy: 84,
    precision: 78,
    totalSwings: 0,
  });

  const [history, setHistory] = useState([
    { t: "0", hr: 92, speed: 22 },
    { t: "5", hr: 98, speed: 26 },
    { t: "10", hr: 108, speed: 31 },
    { t: "15", hr: 116, speed: 29 },
    { t: "20", hr: 121, speed: 35 },
    { t: "25", hr: 118, speed: 33 },
    { t: "30", hr: 124, speed: 37 },
  ]);

  const [zoneCounts, setZoneCounts] = useState({
    center: 42,
    upper: 12,
    lower: 9,
    left_edge: 7,
    right_edge: 10,
  });

  const [recentShots, setRecentShots] = useState([
    { id: 1, zone: "center", force: "Medium", speed: "31 mph", result: "Clean contact" },
    { id: 2, zone: "upper", force: "High", speed: "36 mph", result: "Slight mishit" },
    { id: 3, zone: "center", force: "Medium", speed: "34 mph", result: "Controlled shot" },
    { id: 4, zone: "right_edge", force: "Low", speed: "24 mph", result: "Off-center" },
  ]);

  const [selectedZone, setSelectedZone] = useState("center");

  useEffect(() => {
    socket.on("sensorUpdate", (data) => {
    console.log("FRONTEND GOT:", data);
      setLiveData((prev) => ({
        ...prev,
        ...data,
      }));

      setSelectedZone(data.hitLocation || "center");

      setHistory((prev) => [
        ...prev.slice(-19),
        {
          t: new Date().toLocaleTimeString(),
          hr: data.heartRate ?? 0,
          speed: data.swingSpeed ?? 0,
        },
      ]);

      if (data.hitLocation) {
        setZoneCounts((prev) => ({
          ...prev,
          [data.hitLocation]: (prev[data.hitLocation] || 0) + 1,
        }));

        setRecentShots((prev) => {
          const nextShot = {
            id: (prev[0]?.id || 0) + 1,
            zone: data.hitLocation,
            force:
              data.swingForce >= 85
                ? "High"
                : data.swingForce >= 60
                ? "Medium"
                : "Low",
            speed: `${data.swingSpeed ?? 0} mph`,
            result: data.hitLocation === "center" ? "Clean contact" : "Off-center",
          };

          return [nextShot, ...prev].slice(0, 4);
        });
      }
    });

    return () => {
      socket.off("sensorUpdate");
    };
  }, []);

  const hitZoneData = [
    { zone: "Center", hits: zoneCounts.center },
    { zone: "Upper", hits: zoneCounts.upper },
    { zone: "Lower", hits: zoneCounts.lower },
    { zone: "Left Edge", hits: zoneCounts.left_edge },
    { zone: "Right Edge", hits: zoneCounts.right_edge },
  ];

  const radarData = [
    { metric: "Accuracy", value: liveData.accuracy || 0 },
    { metric: "Precision", value: liveData.precision || 0 },
    { metric: "Power", value: Math.min(liveData.swingForce || 0, 100) },
    { metric: "Control", value: liveData.hitLocation === "center" ? 88 : 70 },
    { metric: "Consistency", value: 69 },
    { metric: "Reaction", value: 72 },
  ];

  const coachingTip = useMemo(() => {
    if (liveData.hitLocation === "center") {
      return "Most recent contact is on the sweet spot. Keep the paddle face stable and repeat that timing.";
    }
    return "Off-center contact is showing up in this session. Focus on timing and paddle alignment to improve precision.";
  }, [liveData.hitLocation]);

  return (
    <div className="page">
      <div className="container">
        <div className="topbar">
          <div>
            <h1 className="page-title">Smart Pickleball Paddle Dashboard</h1>
            <p className="page-subtitle">
              Real-time tracking for contact accuracy, swing performance, and player biometrics.
            </p>
          </div>

          <div className="topbar-badges">
            <Badge>Live Session</Badge>
            <Badge secondary>Player 01</Badge>
          </div>
        </div>

        <div className="metrics-grid">
          <MetricCard
            title="Heart Rate"
            value={`${liveData.heartRate} bpm`}
            subtitle="Current handle sensor reading"
          />
          <MetricCard
            title="Swing Speed"
            value={`${liveData.swingSpeed} mph`}
            subtitle="Fastest swing this session"
          />
          <MetricCard
            title="Accuracy"
            value={`${liveData.accuracy}%`}
            subtitle="Center-zone contact score"
          />
          <MetricCard
            title="Calories"
            value={`${liveData.calories} kcal`}
            subtitle="Estimated session burn"
          />
        </div>

        <div className="tabs-row">
          <TabButton active={activeTab === "performance"} onClick={() => setActiveTab("performance")}>
            Performance
          </TabButton>
          <TabButton active={activeTab === "contact"} onClick={() => setActiveTab("contact")}>
            Contact Map
          </TabButton>
          <TabButton active={activeTab === "insights"} onClick={() => setActiveTab("insights")}>
            Insights
          </TabButton>
        </div>

        {activeTab === "performance" && (
          <div className="two-col-grid">
            <div className="card">
              <div className="card-header">
                <h2>Heart Rate Over Time</h2>
              </div>
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={history}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="t" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="hr" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h2>Swing Speed Trend</h2>
              </div>
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={history}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="t" />
                    <YAxis />
                    <Tooltip />
                    <Line type="monotone" dataKey="speed" strokeWidth={2} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === "contact" && (
          <div className="two-col-grid">
            <PaddleFace selectedZone={selectedZone} setSelectedZone={setSelectedZone} />

            <div className="card">
              <div className="card-header">
                <h2>Hit Distribution by Zone</h2>
              </div>
              <div className="chart-wrap tall-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={hitZoneData}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="zone" />
                    <YAxis />
                    <Tooltip />
                    <Bar dataKey="hits" />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}

        {activeTab === "insights" && (
          <div className="insights-grid">
            <div className="card">
              <div className="card-header">
                <h2>Skill Profile</h2>
              </div>
              <div className="chart-wrap medium-chart">
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart data={radarData}>
                    <PolarGrid />
                    <PolarAngleAxis dataKey="metric" />
                    <PolarRadiusAxis domain={[0, 100]} />
                    <Radar dataKey="value" fillOpacity={0.2} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card insights-panel">
              <div className="card-header">
                <h2>Session Feedback</h2>
              </div>

              <div className="feedback-box">
                <p className="feedback-label">Coaching Tip</p>
                <p className="feedback-text">{coachingTip}</p>
              </div>

              <div className="feedback-box">
                <p className="feedback-label">Recent Shots</p>

                <div className="shots-list">
                  {recentShots.map((shot) => (
                    <div key={shot.id} className="shot-row">
                      <div>
                        <p className="shot-title">Shot #{shot.id}</p>
                        <p className="shot-result">{shot.result}</p>
                      </div>

                      <div className="shot-badges">
                        <Badge secondary>{shot.zone}</Badge>
                        <Badge secondary>{shot.force}</Badge>
                        <Badge secondary>{shot.speed}</Badge>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}