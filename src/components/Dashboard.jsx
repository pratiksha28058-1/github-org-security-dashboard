import React, { useEffect, useState } from "react";
//import GithubService from '@/GithubService.jsx';

// import { fetchRepositories, fetchSecurityAlerts } from '@/GithubService.jsx';
// import React, { useEffect, useState } from "react";
import { fetchRepositories, fetchSecurityAlerts  } from '@/GithubService.jsx';
import {
  LineChart,
  BarChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  AreaChart,
  Area
} from 'recharts';

import { format, parseISO } from "date-fns";





const Dashboard = () => {
  const [alerts, setAlerts] = useState([]);
  const [filteredAlerts, setFilteredAlerts] = useState([]);
  const [filter, setFilter] = useState("all");
  const [chartData, setChartData] = useState([]); // Add this line
  const [selectedSeverity, setSelectedSeverity] = useState('all');
  const [selectedState, setSelectedState] = useState('all');
  const [startDate, setStartDate] = useState('');
  const [endDate, setEndDate] = useState('');
  const [repositories, setRepositories] = useState([]);
  const [selectedRepository, setSelectedRepository] = useState('all');
  const [org] = useState('pratiksha28058'); // Your organization name
  const [selectedRepo, setSelectedRepo] = useState('');
  const [secretScanningData, setSecretScanningData] = useState([]);
  const [reopenedAlertsData, setReopenedAlertsData] = useState([]);
  const [costData, setCostData] = useState([]);
  const [fixedChartData, setFixedChartData] = useState([]);
  const [reopenedChartData, setReopenedChartData] = useState([]);


  // Fetch repositories
  useEffect(() => {
    async function getRepositories() {
      try {
        const repoNames = await fetchRepositories(org);
        setRepositories(repoNames);
        setSelectedRepo(repoNames[0] || ''); // Default to the first repository
      } catch (error) {
        console.error(error);
      }
    }
    getRepositories();
  }, [org]);

  
  useEffect(() => {
    async function getAlerts() {
      if (!selectedRepo) return;
      try {
        const data = await fetchSecurityAlerts(org, selectedRepo);
        setAlerts(data);
        setFilteredAlerts(data);
      } catch (error) {
        console.error(error);
      }
    }
    getAlerts();
  }, [org, selectedRepo]);


// Fetch alerts
useEffect(() => {
  async function getAlerts() {
    try {
      const data = await fetchSecurityAlerts();
      setAlerts(data);
      setFilteredAlerts(data);
    } catch (error) {
      console.error("Error fetching alerts:", error);
    }
  }
  getAlerts();
}, []);
  
  

  useEffect(() => {
    async function getAlerts() {
      const data = await fetchSecurityAlerts();
      const aggregatedData = aggregateAlertsByDateAndSeverity(data);
      console.log("GitHub Security Alerts:", data);
      setAlerts(data);
      setFilteredAlerts(data);
      setChartData(aggregatedData);
    }
    getAlerts();
  }, []);



  //All Open Alerts
  const aggregateAlertsByDateAndSeverity = (alerts) => {
    const openAlerts = alerts.filter(alert => alert.state === 'open');
    const counts = openAlerts.reduce((acc, alert) => {
      const date = alert.updated_at.split("T")[0];
      const severity = alert.rule?.severity || "unknown";
  
      if (!acc[date]) {
        acc[date] = { date, timestamp: new Date(date).getTime(), error: 0, warning: 0, note: 0, unknown: 0 };
      }
      acc[date][severity] += 1;
  
      return acc;
    }, {});
  
    return Object.values(counts).sort((a, b) => a.timestamp - b.timestamp);
  };
  
  
  
  useEffect(() => {
    async function getAlerts() {
      const data = await fetchSecurityAlerts();
      //const aggregatedData = aggregateAlertsByDateAndSeverity(data);
      const aggregatedData = aggregateOpenAlertsByDateAndSeverity(filteredAlerts);
      console.log("GitHub Security Alerts:", data);
      setAlerts(data);
      setFilteredAlerts(data);
      setChartData(aggregatedData);
    }
    
    getAlerts();
  }, [filteredAlerts]);


  useEffect(() => {
    const aggregatedData = aggregateAlertsByDateAndSeverity(filteredAlerts);
    setChartData(aggregatedData);
  }, [filteredAlerts]);

  
  const aggregateDailyAlertTrends = (alerts) => {
    if (!alerts.length) return [];
  
    const today = new Date();
    const startDate = new Date(
      Math.min(...alerts.map(a => new Date(a.created_at)))
    );
  
    // Create daily buckets
    const dateMap = {};
    for (let d = new Date(startDate); d <= today; d.setDate(d.getDate() + 1)) {
      const dateStr = d.toISOString().split('T')[0];
      dateMap[dateStr] = {
        date: dateStr,
        timestamp: new Date(dateStr).getTime(),
        open: 0,
        dismissed: 0,
        fixed: 0,
      };
    }
  
    // Populate buckets
    alerts.forEach(alert => {
      const created = new Date(alert.created_at);
      const end = alert.dismissed_at
        ? new Date(alert.dismissed_at)
        : alert.fixed_at
        ? new Date(alert.fixed_at)
        : today;
      const state = alert.state;
  
      for (let d = new Date(created); d <= end; d.setDate(d.getDate() + 1)) {
        const dateStr = d.toISOString().split('T')[0];
        if (!dateMap[dateStr]) continue;
  
        if (state === 'open') {
          dateMap[dateStr].open += 1;
        } else if (state === 'dismissed') {
          dateMap[dateStr].dismissed += 1;
        } else if (state === 'fixed') {
          dateMap[dateStr].fixed += 1;
        }
      }
    });
  
    return Object.values(dateMap).sort((a, b) => a.timestamp - b.timestamp);
  };
  

  useEffect(() => {
    const dailyTrendData = aggregateDailyAlertTrends(filteredAlerts);
    setChartData(dailyTrendData);
  }, [filteredAlerts]);
  

  // useEffect(() => {
  //   const aggregatedData = aggregateAlertsByDateSeverityAndState(filteredAlerts);
  //   setChartData(aggregatedData);
  // }, [filteredAlerts]);
  


  const aggregateAlertsByDate = (alerts) => {
    const counts = alerts.reduce((acc, alert) => {
      const date = alert.created_at.split("T")[0]; // Extract YYYY-MM-DD
      const severity = alert.rule?.severity || "unknown";
      acc[date] = (acc[date] || 0) + 1;

      if (!acc[date]) {
        acc[date] = { date, timestamp: parseISO(date).getTime(), error: 0, warning: 0, note: 0, unknown: 0 };
      }
      acc[date][severity] += 1;

      return acc;
    }, {});

    return Object.values(counts).sort((a, b) => a.timestamp - b.timestamp);
  };



  const formatXAxis = (tickItem) => {
    return format(new Date(tickItem), "MMM dd, yyyy HH:mm");
  };


  //Saving State to localStorage:
  useEffect(() => {
    const stateToPersist = {
      selectedRepo,
      selectedSeverity,
      selectedState,
      selectedRepository,
    };
    localStorage.setItem('dashboardState', JSON.stringify(stateToPersist));
  }, [selectedRepo, selectedSeverity, selectedState, selectedRepository]);
  





 // Count all open severity alerts
const openAlertsCount = filteredAlerts.filter(
  (alert) => alert.state === 'open'
).length;

  // Count open error severity alerts
  const openErrorCount = filteredAlerts.filter(
    (alert) => alert.state === 'open' && alert.rule?.severity === 'error'
  ).length;

 // Count all open warning severity alerts
 const openWarningCount = filteredAlerts.filter(
  (alert) => alert.state === 'open'  && alert.rule?.severity === 'warning'
).length;

// Count all open Notes severity alerts
const openNotesCount = filteredAlerts.filter(
  (alert) => alert.state === 'open'  && alert.rule?.severity === 'note'
).length;


// Count all dismissed severity alerts
const DimissedCount = filteredAlerts.filter(
  (alert) => alert.state === 'closed'  && alert.state === 'dismissed'
).length;


// Count critical security_severity_level alerts
const CriticalSeverityCount = filteredAlerts.filter(
  (alert) => alert.state === 'open' && alert.rule?.security_severity_level === 'critical' 
).length;

// Count High security_severity_level alerts
const HighSeverityCount = filteredAlerts.filter(
  (alert) => alert.state === 'open' && alert.rule?.security_severity_level === 'high' 
).length;

// Count Low security_severity_level alerts
const LowSeverityCount = filteredAlerts.filter(
  (alert) => alert.state === 'open' && alert.rule?.security_severity_level === 'low' 
).length;


// Filter Fixed Error Alerts

const closedErrorAlerts = alerts.filter(
  (alert) =>
    alert.rule?.severity === 'error' &&
    (alert.state === 'dismissed' || alert.state === 'fixed')
);

const closedErrorCounts = closedErrorAlerts.reduce((acc, alert) => {
  const state = alert.state;
  acc[state] = (acc[state] || 0) + 1;
  return acc;
}, {});



  // Count alerts by severity
  const severityCounts = alerts.reduce((acc, alert) => {
    const severity = alert.rule?.severity || "unknown";
    acc[severity] = (acc[severity] || 0) + 1;
    return acc;
  }, {});

  //Convert counts to chart data
   const chartData1 = Object.keys(severityCounts).map((severity) => ({
     name: severity,
     count: severityCounts[severity],
   }));

  // Filter alerts based on selected filters
  useEffect(() => {
    let filtered = alerts;

    if (selectedSeverity !== 'all') {
      filtered = filtered.filter(alert => alert.rule?.severity === selectedSeverity);
    }

    if (selectedState !== 'all') {
      filtered = filtered.filter(alert => alert.state === selectedState);
    }

    if (selectedRepository !== 'all') {
      filtered = filtered.filter(alert => alert.repository?.name === selectedRepository);
    }

    setFilteredAlerts(filtered);
  }, [selectedSeverity, selectedState, selectedRepository, alerts]);
  
  
  //Fixed Chart Data 
  const aggregateFixedAlerts = (alerts) => {
    const fixedAlerts = alerts.filter(alert => alert.fixed_at);
  
    const counts = fixedAlerts.reduce((acc, alert) => {
      const date = alert.fixed_at .split("T")[0]; // Only date part
      if (!acc[date]) {
        acc[date] = {
          date,
          timestamp: new Date(date).getTime(),
          count: 0,
        };
      }
      acc[date].count += 1;
      return acc;
    }, {});
  
    return Object.values(counts).sort((a, b) => a.timestamp - b.timestamp);
  };
  

  

useEffect(() => {
  const fixedData = aggregateFixedAlerts(filteredAlerts);
  setFixedChartData(fixedData);
}, [filteredAlerts]);


// Reopen Alerts


const aggregateReopenedAlerts  = (alerts) => {
  const reopenedAlerts = alerts.filter(alert => alert.dismissed_at);

  const counts = reopenedAlerts.reduce((acc, alert) => {
    const date = alert.dismissed_at .split("T")[0]; // Only date part
    if (!acc[date]) {
      acc[date] = {
        date,
        timestamp: new Date(date).getTime(),
        count: 0,
      };
    }
    acc[date].count += 1;
    return acc;
  }, {});

  return Object.values(counts).sort((a, b) => a.timestamp - b.timestamp);
};


useEffect(() => {
const reopenedData  = aggregateReopenedAlerts (filteredAlerts);
setReopenedChartData(reopenedData);
}, [filteredAlerts]);






  return (
    <div>




<h2>Apply Filters</h2>


<div style={{ display: 'flex', gap: '1rem', marginBottom: '1rem' }}>
  <div style={{
    backgroundColor: '#e6f7ff',
    border: '1px solid #1890ff',
    padding: '1rem',
    borderRadius: '8px'
  }}>
    <strong>Total Open Alerts:</strong> {openAlertsCount}
  </div>

  <div style={{
    backgroundColor: '#E9573F',
    border: '1px solidrgb(255, 24, 24)',
    padding: '1rem',
    borderRadius: '8px'
  }}>
    <strong>Errors:</strong> {openErrorCount}
  </div>

  <div style={{
    backgroundColor: '#F6BB42',
    border: '1px solidrgb(224, 255, 24)',
    padding: '1rem',
    borderRadius: '8px'
  }}>
    <strong>Warnings:</strong> {openWarningCount}
  </div>


 <div style={{
    backgroundColor: '#8CC152',
    border: '1px solidrgb(224, 255, 24)',
    padding: '1rem',
    borderRadius: '8px'
  }}>
    <strong>Notes:</strong> {openNotesCount}
  </div>



  <div style={{
    backgroundColor: '#E9573F',
    border: '1px solidrgb(224, 255, 24)',
    padding: '1rem',
    borderRadius: '8px'
  }}>
    <strong>Critical:</strong> {CriticalSeverityCount}
  </div>


  <div style={{
    backgroundColor: '#F6BB42',
    border: '1px solidrgb(224, 255, 24)',
    padding: '1rem',
    borderRadius: '8px'
  }}>
    <strong>High:</strong> {HighSeverityCount}
  </div>

  <div style={{
    backgroundColor: '#8CC152',
    border: '1px solidrgb(224, 255, 24)',
    padding: '1rem',
    borderRadius: '8px'
  }}>
    <strong>Low:</strong> {LowSeverityCount}
  </div>



</div>



{/* Repository Filter Dropdown */}
<label htmlFor="repo-filter">Select Repository:</label>
      <select
        id="repo-filter"
        value={selectedRepo}
        onChange={(e) => setSelectedRepo(e.target.value)}
      >
        {repositories.map((repo) => (
          <option key={repo} value={repo}>
            {repo}
          </option>
        ))}
      </select>

<label htmlFor="severity-filter">Filter by Severity:</label>
<select
  id="severity-filter"
  value={selectedSeverity}
  onChange={(e) => setSelectedSeverity(e.target.value)}
>
  <option value="all">All</option>
  <option value="error">Errors</option>
  <option value="warning">Warnings</option>
  <option value="note">Notes</option>
  <option value="unknown">Unknown</option>
</select>

<label htmlFor="state-filter">Filter by State:</label>
<select
  id="state-filter"
  value={selectedState}
  onChange={(e) => setSelectedState(e.target.value)}
>
  <option value="all">All</option>
  <option value="open">Open</option>
  <option value="dismissed">Dismissed</option>
  <option value="fixed">Fixed</option>
</select>




<h2>Detection</h2>

      <h4>All Alerts Over Time</h4>
      <ResponsiveContainer width="100%" height={300}>
        <LineChart data={chartData}>
          <XAxis
            dataKey="timestamp"
            type="number"
            domain={["auto", "auto"]}
            tickFormatter={(tick) => format(new Date(tick), "MMM dd, yyyy HH:mm")}
          />
          <YAxis />
          <Tooltip
            labelFormatter={(label) => format(new Date(label), "MMM dd, yyyy HH:mm")}
          />
          <Legend />
          <Line type="monotone" dataKey="open" stroke="#FF0000" name="Open Total" />
          <Line type="monotone" dataKey="dismissed" stroke="#00AA00" name="Dismissed Total" />
          <Line type="monotone" dataKey="fixed" stroke="#0000FF" name="Fixed Total" />
        </LineChart>
      </ResponsiveContainer>


      <h4>ReOpened Alerts Over Time</h4>
      <ResponsiveContainer width="100%" height={300}>
  <AreaChart data={reopenedChartData}>
    <XAxis
      dataKey="timestamp"
      type="number"
      domain={['auto', 'auto']}
      tickFormatter={(tick) => format(new Date(tick), "MMM dd, yyyy HH:mm")}
    />
    <YAxis />
    <Tooltip labelFormatter={(label) => format(new Date(label), "MMM dd, yyyy HH:mm")} />
    <Area dataKey="count" fill="#0000FF" name="ReOpened Alerts" />
  </AreaChart>
</ResponsiveContainer>



     

<h2>Remediation </h2>
<h4>Fixed Alerts Over Time</h4>
<ResponsiveContainer width="100%" height={300}>
  <AreaChart data={fixedChartData}>
    <XAxis
      dataKey="timestamp"
      type="number"
      domain={['auto', 'auto']}
      tickFormatter={(tick) => format(new Date(tick), "MMM dd, yyyy HH:mm")}
    />
    <YAxis />
    <Tooltip labelFormatter={(label) => format(new Date(label), "MMM dd, yyyy HH:mm")} />
    <Area dataKey="count" fill="#0000FF" name="Fixed Alerts" />
  </AreaChart>
</ResponsiveContainer>







<h4>Time to Fix</h4>
Analyzes the average duration taken to remediate alerts, helping assess the efficiency of your response processes



<h4>Dismissed Alert</h4>
Counts the alerts that have been dismissed, providing insight into potential false positives or accepted risks



<h2>Prevention </h2>
<h4>Prevented Vulnerabilities</h4>
Displays the number of vulnerabilities that were detected and prevented before merging into the main branch



<h2>GitHub Security Alerts Table</h2>

{filteredAlerts.length === 0 ? (
  <p>No security issues found! </p>
) : (
  <table border="1">
    <thead>
      <tr>
        <th>ID</th>
        <th>Description</th>
        <th>Severity</th>
        <th>State</th>
        <th>Created</th>
        <th>Dismissed</th>
        <th>Updated</th>
        <th>url</th>
        <th>Link</th>
      </tr>
    </thead>
    <tbody>
      {filteredAlerts.map((alert) => (
        <tr key={alert.id}>
          <td>{alert.number}</td>
          <td>{alert.rule?.description || "No Description"}</td>
          <td>{alert.rule?.severity}</td>
          <td>{alert.state}</td>
          <td>{alert.created_at}</td>
          <td>{alert.dismissed_at}</td>
          <td>{alert.updated_at}</td>
          <td>{alert.html_url}</td>

          <td>
            <a
              href={alert.html_url}
              target="_blank"
              rel="noopener noreferrer"
            >
              View on GitHub
            </a>
          </td>
        </tr>
      ))}
    </tbody>
  </table>
)}

      
      

    </div>
  );
};

export default Dashboard;
