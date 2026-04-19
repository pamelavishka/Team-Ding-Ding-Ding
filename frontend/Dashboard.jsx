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
            This section is ready for paddle-face impact sensors once those are connected.
          </p>
        </div>
      </div>
    </div>
  );
}

export default function Dashboard() {
  const [activeTab, setActiveTab] = useState("performance");

  const [liveData, setLiveData] = useState({
    heartRate: 72,
    calories: 0,
    swingSpeed: 0,
    swingForce: 0,
    swingDistance: 0,
    hitLocation: "center",
    accuracy: 0,
    precision: 0,
    totalSwings: 0,
  });

  const [history, setHistory] = useState(
    Array.from({ length: 12 }, (_, i) => ({
      t: i + 1,
      force: 0,
      speed: 0,
      distance: 0,
    }))
  );

  const [zoneCounts, setZoneCounts] = useState({
    center: 42,
    upper: 12,
    lower: 9,
    left_edge: 7,
    right_edge: 10,
  });

  const [recentShots, setRecentShots] = useState([
    { id: 1, zone: "center", force: "Medium", speed: "31", result: "Clean contact" },
    { id: 2, zone: "upper", force: "High", speed: "36", result: "Slight mishit" },
    { id: 3, zone: "center", force: "Medium", speed: "34", result: "Controlled shot" },
    { id: 4, zone: "right_edge", force: "Low", speed: "24", result: "Off-center" },
  ]);

  const [selectedZone, setSelectedZone] = useState("center");

  useEffect(() => {
    socket.on("sensorUpdate", (data) => {
      setLiveData((prev) => ({
        ...prev,
        ...data,
      }));

      setHistory((prev) => {
        const last = prev[prev.length - 1] || { force: 0, speed: 0, distance: 0 };

        const nextForceRaw = Math.round(data.swingForce ?? last.force ?? 0);
        const nextSpeedRaw = Math.round(data.swingSpeed ?? last.speed ?? 0);
        const nextDistanceRaw = Math.round(data.swingDistance ?? last.distance ?? 0);

        // smoothing so the graph changes more naturally
        const nextForce = Math.round(last.force * 0.65 + nextForceRaw * 0.35);
        const nextSpeed = Math.round(last.speed * 0.65 + nextSpeedRaw * 0.35);
        const nextDistance = Math.round(last.distance * 0.65 + nextDistanceRaw * 0.35);

        const nextPoint = {
          t: (prev[prev.length - 1]?.t || 0) + 1,
          force: nextForce,
          speed: nextSpeed,
          distance: nextDistance,
        };

        return [...prev.slice(-11), nextPoint];
      });

      if (data.hitLocation) {
        setSelectedZone(data.hitLocation);

        setZoneCounts((prev) => ({
          ...prev,
          [data.hitLocation]: (prev[data.hitLocation] || 0) + 1,
        }));

        setRecentShots((prev) => {
          const forceLabel =
            (data.swingForce ?? 0) >= 70
              ? "High"
              : (data.swingForce ?? 0) >= 35
              ? "Medium"
              : "Low";

          const nextShot = {
            id: (prev[0]?.id || 0) + 1,
            zone: data.hitLocation,
            force: forceLabel,
            speed: `${Math.round(data.swingSpeed ?? 0)}`,
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
    { metric: "Force", value: Math.round(liveData.swingForce || 0) },
    { metric: "Speed", value: Math.round(liveData.swingSpeed || 0) },
    { metric: "Distance", value: Math.round(liveData.swingDistance || 0) },
    { metric: "Accuracy", value: Math.round(liveData.accuracy || 0) },
    { metric: "Precision", value: Math.round(liveData.precision || 0) },
    { metric: "Control", value: liveData.hitLocation === "center" ? 88 : 70 },
  ];

  const coachingTip = useMemo(() => {
    if ((liveData.swingSpeed || 0) > 70) {
      return "Swing speed is high right now. Focus on repeatable control so the motion stays consistent.";
    }

    if ((liveData.swingForce || 0) > 70) {
      return "Force is spiking. Make sure your swing stays smooth instead of getting tense.";
    }

    if ((liveData.accuracy || 0) > 80) {
      return "Accuracy is looking strong. Keep repeating the same contact timing.";
    }

    return "Motion input is coming through. As other sensors are added, this dashboard will combine all paddle and player data live.";
  }, [liveData.swingSpeed, liveData.swingForce, liveData.accuracy]);

  return (
    <div className="page">
      <div className="container">
        <div className="topbar">
          <div>
            <h1 className="page-title">Smart Pickleball Paddle Dashboard</h1>
            <p className="page-subtitle">
              Real-time tracking for paddle motion, contact quality, and player performance.
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
            value={`${Math.round(liveData.heartRate || 0)} bpm`}
            subtitle="Future biometric input"
          />
          <MetricCard
            title="Swing Speed"
            value={`${Math.round(liveData.swingSpeed || 0)}`}
            subtitle="Accelerometer input"
          />
          <MetricCard
            title="Accuracy"
            value={`${Math.round(liveData.accuracy || 0)}%`}
            subtitle="Future paddle-face input"
          />
          <MetricCard
            title="Calories"
            value={`${Math.round(liveData.calories || 0)} kcal`}
            subtitle="Future biometric estimate"
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
                <h2>Force Over Time</h2>
              </div>
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={history}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="t" hide />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="force" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h2>Speed Over Time</h2>
              </div>
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={history}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="t" hide />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="speed" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h2>Distance Over Time</h2>
              </div>
              <div className="chart-wrap">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={history}>
                    <CartesianGrid strokeDasharray="3 3" />
                    <XAxis dataKey="t" hide />
                    <YAxis domain={[0, 100]} />
                    <Tooltip />
                    <Line type="monotone" dataKey="distance" strokeWidth={2} dot={false} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="card">
              <div className="card-header">
                <h2>Motion Summary</h2>
              </div>
              <div className="card-body">
                <div className="zone-stats-box">
                  <div className="zone-stat">
                    <div className="zone-stat-row">
                      <span>Force</span>
                      <span>{Math.round(liveData.swingForce || 0)}</span>
                    </div>
                    <ProgressBar value={Math.round(liveData.swingForce || 0)} />
                  </div>

                  <div className="zone-stat">
                    <div className="zone-stat-row">
                      <span>Speed</span>
                      <span>{Math.round(liveData.swingSpeed || 0)}</span>
                    </div>
                    <ProgressBar value={Math.round(liveData.swingSpeed || 0)} />
                  </div>

                  <div className="zone-stat">
                    <div className="zone-stat-row">
                      <span>Distance</span>
                      <span>{Math.round(liveData.swingDistance || 0)}</span>
                    </div>
                    <ProgressBar value={Math.round(liveData.swingDistance || 0)} />
                  </div>
                </div>
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