import React, { useState, useEffect } from 'react';
import { Button, Card, Typography, Space, message, Tag } from 'antd';
import { useNavigate } from 'react-router-dom';
import { 
  UserPlus, 
  ShieldCheck, 
  ClipboardList, 
  LogIn, 
  LogOut, 
  User, 
  LayoutDashboard,
  GraduationCap,
  School,
  QrCode
} from 'lucide-react';

const { Title, Text } = Typography;

const Lobby = () => {
  const navigate = useNavigate();
  const [user, setUser] = useState(null);

  useEffect(() => {
    const savedUser = localStorage.getItem('user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    setUser(null);
    message.success('已登出系統');
  };

  const getRoleColor = (role) => {
    switch (role) {
      case 'admin': return 'red';
      case 'guard': return 'green';
      case 'teacher': return 'orange';
      case 'student': return 'blue';
      default: return 'gray';
    }
  };

  const getRoleName = (role) => {
    switch (role) {
      case 'admin': return '管理員';
      case 'guard': return '警衛';
      case 'teacher': return '老師';
      case 'student': return '學生';
      default: return '訪客';
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      {/* 頂部狀態欄 */}
      <div className="absolute top-4 right-4 flex items-center gap-4">
        {user ? (
          <Space>
            <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full shadow-sm border">
              <User size={16} className="text-blue-500" />
              <Text strong>{user.username}</Text>
              <Tag color={getRoleColor(user.role)} className="m-0">{getRoleName(user.role)}</Tag>
            </div>
            {user.role === 'admin' && (
              <Button 
                type="primary" 
                icon={<LayoutDashboard size={16} />} 
                onClick={() => navigate('/admin')}
              >
                管理後台
              </Button>
            )}
            <Button 
              type="text" 
              danger 
              icon={<LogOut size={16} />} 
              onClick={handleLogout}
            >
              登出
            </Button>
          </Space>
        ) : (
          <Button 
            type="primary" 
            ghost 
            icon={<LogIn size={16} />} 
            onClick={() => navigate('/login')}
          >
            人員登入
          </Button>
        )}
      </div>

      <div className="text-center mb-12">
        <Title level={1} className="!mb-2">校園訪客櫃台管理系統</Title>
        <Text type="secondary">歡迎來到校園，請選擇您的服務項目</Text>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-7xl w-full">
        {/* 訪客預約 - 開放給所有人 */}
        <Card 
          hoverable 
          className="text-center border-none shadow-md"
          onClick={() => navigate('/create-appointment')}
        >
          <div className="flex justify-center mb-4 text-blue-500">
            <UserPlus size={48} />
          </div>
          <Title level={4}>訪客預約</Title>
          <Text className="text-xs">預先填寫資料，快速生成 QR Code</Text>
          <div className="mt-6">
            <Button type="primary" block shape="round">立即預約</Button>
          </div>
        </Card>

        {/* 警衛簽到 - 僅限警衛與管理員 */}
        <Card 
          hoverable 
          className={`text-center border-none shadow-md ${!(user?.role === 'guard' || user?.role === 'admin') ? 'opacity-50 grayscale' : ''}`}
          onClick={() => (user?.role === 'guard' || user?.role === 'admin') ? navigate('/guard') : message.warning('僅限警衛或管理員存取')}
        >
          <div className="flex justify-center mb-4 text-green-500">
            <ShieldCheck size={48} />
          </div>
          <Title level={4}>警衛簽到</Title>
          <Text className="text-xs">掃描 QR Code 並拍攝訪客照片</Text>
          <div className="mt-6">
            <Button type="default" block shape="round" disabled={!(user?.role === 'guard' || user?.role === 'admin')}>進入簽到</Button>
          </div>
        </Card>

        {/* 老師/學生專區 - 僅限老師與學生 */}
        <Card 
          hoverable 
          className={`text-center border-none shadow-md ${!(user?.role === 'teacher' || user?.role === 'student' || user?.role === 'admin') ? 'opacity-50 grayscale' : ''}`}
          onClick={() => (user?.role === 'teacher' || user?.role === 'student' || user?.role === 'admin') ? navigate('/records') : message.warning('僅限校內師生存取')}
        >
          <div className="flex justify-center mb-4 text-purple-500">
            {user?.role === 'student' ? <GraduationCap size={48} /> : <School size={48} />}
          </div>
          <Title level={4}>師生專區</Title>
          <Text className="text-xs">查看受訪紀錄與預約通知</Text>
          <div className="mt-6">
            <Button type="default" block shape="round" disabled={!(user?.role === 'teacher' || user?.role === 'student' || user?.role === 'admin')}>進入查看</Button>
          </div>
        </Card>

        {/* 管理後台 - 僅限管理員 */}
        <Card 
          hoverable 
          className={`text-center border-none shadow-md ${user?.role !== 'admin' ? 'opacity-50 grayscale' : ''}`}
          onClick={() => user?.role === 'admin' ? navigate('/admin') : message.warning('僅限管理員存取')}
        >
          <div className="flex justify-center mb-4 text-red-500">
            <LayoutDashboard size={48} />
          </div>
          <Title level={4}>管理後台</Title>
          <Text className="text-xs">系統設定、統計數據與權限管理</Text>
          <div className="mt-6">
            <Button type="default" block shape="round" disabled={user?.role !== 'admin'}>進入後台</Button>
          </div>
        </Card>
      </div>
    </div>
  );
};

export default Lobby;
