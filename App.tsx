import React from 'react';
import { HashRouter, Routes, Route, Navigate } from 'react-router-dom';
import Layout from './components/Layout';
import ClassesScreen from './screens/ClassesScreen';
import StudentsScreen from './screens/StudentsScreen';
import AttendanceScreen from './screens/AttendanceScreen';
import ReportsScreen from './screens/ReportsScreen';
import SettingsScreen from './screens/SettingsScreen';

const App: React.FC = () => {
  return (
    <HashRouter>
      <Routes>
        <Route path="/" element={<Layout />}>
          <Route index element={<Navigate to="/attendance" replace />} />
          <Route path="classes" element={<ClassesScreen />} />
          <Route path="students" element={<StudentsScreen />} />
          <Route path="attendance" element={<AttendanceScreen />} />
          <Route path="reports" element={<ReportsScreen />} />
          <Route path="settings" element={<SettingsScreen />} />
        </Route>
      </Routes>
    </HashRouter>
  );
};

export default App;