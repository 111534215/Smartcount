import React from 'react';
import { BrowserRouter as Router, Routes, Route } from 'react-router-dom';
import { ConfigProvider, App as AntdApp } from 'antd';
import zhTW from 'antd/locale/zh_TW';
import Lobby from './pages/Lobby';
import CreateAppointment from './pages/CreateAppointment';
import Records from './pages/Records';
import GuardCheckin from './pages/GuardCheckin';
import Login from './pages/Login';
import AdminDashboard from './pages/AdminDashboard';
import FindMyQRCode from './pages/FindMyQRCode';
import AdminSettings from './pages/AdminSettings';

function App() {
  return (
    <ConfigProvider locale={zhTW}>
      <AntdApp>
        <Router>
          <Routes>
            <Route path="/" element={<Lobby />} />
            <Route path="/login" element={<Login />} />
            <Route path="/create-appointment" element={<CreateAppointment />} />
            <Route path="/find-qrcode" element={<FindMyQRCode />} />
            <Route path="/guard" element={<GuardCheckin />} />
            <Route path="/records" element={<Records />} />
            <Route path="/admin" element={<AdminDashboard />} />
            <Route path="/admin/settings" element={<AdminSettings />} />
          </Routes>
        </Router>
      </AntdApp>
    </ConfigProvider>
  );
}

export default App;
