import React, { useMemo } from 'react';
import { useQuery } from '@tanstack/react-query';
import { fetchIssues } from './api';
import { PieChart, Pie, Cell, BarChart, Bar, XAxis, YAxis, Tooltip, Legend, ResponsiveContainer } from 'recharts';

const COLORS = ['#0052cc', '#00B8D9', '#36B37E', '#FFAB00', '#FF5630'];

export default function Dashboard({ projectId }) { 
  
  const { data: issues = [], isLoading } = useQuery({
    // 2. Add projectId to the unique key (so it refreshes when project changes)
    queryKey: ['issues', projectId], 
    
    // 3. CRITICAL FIX: Use Arrow Function to pass the ID safely
    queryFn: () => fetchIssues(projectId), 
    
    // 4. Only run if we have a project selected
    enabled: !!projectId 
  });

  // 1. Calculate Status Counts (Pie Chart)
  const statusData = useMemo(() => {
    const counts = { TODO: 0, IN_PROG: 0, DONE: 0 };
    issues.forEach(i => {
      if (counts[i.status] !== undefined) counts[i.status]++;
    });
    return [
      { name: 'To Do', value: counts.TODO, color: '#dfe1e6' },       // Grey
      { name: 'In Progress', value: counts.IN_PROG, color: '#0052cc' }, // Blue
      { name: 'Done', value: counts.DONE, color: '#36B37E' }         // Green
    ];
  }, [issues]);

  // 2. Calculate Priority Counts (Bar Chart)
  const priorityData = useMemo(() => {
    const counts = { LOW: 0, MED: 0, HIGH: 0 };
    issues.forEach(i => {
      if (counts[i.priority] !== undefined) counts[i.priority]++;
    });
    return [
      { name: 'Low', count: counts.LOW },
      { name: 'Medium', count: counts.MED },
      { name: 'High', count: counts.HIGH },
    ];
  }, [issues]);

  if (isLoading) return <div>Loading Stats...</div>;

  return (
    <div style={{ padding: '40px', background: '#f4f5f7', minHeight: '100vh' }}>
      <h2 style={{ color: '#172b4d', marginBottom: '30px' }}>Project Dashboard</h2>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '30px' }}>
        
        {/* CARD 1: Status Breakdown */}
        <div style={cardStyle}>
          <h3 style={headerStyle}>Issue Status</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusData}
                  cx="50%"
                  cy="50%"
                  innerRadius={60}
                  outerRadius={80}
                  paddingAngle={5}
                  dataKey="value"
                >
                  {statusData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={entry.color} />
                  ))}
                </Pie>
                <Tooltip />
                <Legend verticalAlign="bottom" height={36}/>
              </PieChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CARD 2: Priority Breakdown */}
        <div style={cardStyle}>
          <h3 style={headerStyle}>Issues by Priority</h3>
          <div style={{ height: '300px' }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={priorityData}>
                <XAxis dataKey="name" />
                <YAxis allowDecimals={false} />
                <Tooltip cursor={{fill: 'transparent'}} />
                <Bar dataKey="count" fill="#ff5630" barSize={50} radius={[4, 4, 0, 0]} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* CARD 3: Quick Stats */}
        <div style={{ ...cardStyle, gridColumn: 'span 2', display: 'flex', justifyContent: 'space-around', padding: '40px' }}>
            <StatBox label="Total Issues" value={issues.length} />
            <StatBox label="Completed" value={statusData[2].value} color="#36B37E" />
            <StatBox label="Pending" value={statusData[0].value + statusData[1].value} color="#FF5630" />
        </div>

      </div>
    </div>
  );
}

// Sub-component for stats
function StatBox({ label, value, color = '#172b4d' }) {
    return (
        <div style={{ textAlign: 'center' }}>
            <div style={{ fontSize: '36px', fontWeight: 'bold', color: color }}>{value}</div>
            <div style={{ fontSize: '14px', color: '#5e6c84', textTransform: 'uppercase', marginTop: '5px' }}>{label}</div>
        </div>
    )
}

// Styles
const cardStyle = { background: 'white', padding: '20px', borderRadius: '8px', boxShadow: '0 1px 3px rgba(0,0,0,0.12)' };
const headerStyle = { margin: '0 0 20px 0', fontSize: '16px', color: '#5e6c84', textTransform: 'uppercase', letterSpacing: '0.5px' };