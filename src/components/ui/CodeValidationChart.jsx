// src/components/CodeValidationChart.jsx
import React from 'react';
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  Tooltip,
  CartesianGrid,
  Legend,
  ResponsiveContainer
} from 'recharts';
import { format, parseISO } from "date-fns";



const CodeValidationChart = ({ data }) => (
  <ResponsiveContainer width="100%" height={400}>
    <ComposedChart data={data} margin={{ top: 20, right: 30, left: 20, bottom: 5 }}>
      <CartesianGrid strokeDasharray="3 3" />
      <XAxis 
        dataKey="date"
      />
      
      <YAxis />
      <Tooltip 
        labelFormatter={(label) =>
                  format(new Date(label), "MMM dd, yyyy HH:mm")
                } />
      <Legend />
      <Bar dataKey="newlyOpened" fill="#8884d8" name="Newly Opened" />
      <Bar dataKey="fixed" fill="#82ca9d" name="Closed" />
      <Bar dataKey="dismissed" fill="#ffc658" name="Dismissed" />
      <Line type="monotone" dataKey="allOpen" stroke="#ff7f50" name="All Open" />
    </ComposedChart>
  </ResponsiveContainer>
);

export default CodeValidationChart;
