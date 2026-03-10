import React, { useState, useEffect } from 'react';
import { 
  Layout, 
  Menu, 
  Card, 
  Statistic, 
  Row, 
  Col, 
  Table, 
  Tag, 
  Button, 
  Typography, 
  message,
  Space,
  Avatar,
  Tabs,
  Empty
} from 'antd';
import { 
  Users, 
  ShieldCheck, 
  ClipboardList, 
  LogOut, 
  LayoutDashboard, 
  UserCog,
  History,
  TrendingUp,
  UserCheck,
  ArrowLeft,
  Settings
} from 'lucide-react';
import { useNavigate } from 'react-router-dom';
import { appointmentApi, userApi } from '../api/api';
import dayjs from 'dayjs';

const { Header, Content, Sider } = Layout;
const { Title, Text } = Typography;

const AdminDashboard = () => {
  const [appointments, setAppointments] = useState([]);
  const [users, setUsers] = useState([]);
  const [activeKey, setActiveKey] = useState('1');
  const [loading, setLoading] = useState(false);
  const [stats, setStats] = useState({
    total: 0,
    pending: 0,
    inSchool: 0,
    completed: 0
  });
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  useEffect(() => {
    if (user.role !== 'admin') {
      message.error('權限不足');
      navigate('/');
      return;
    }
    fetchData();
    fetchUsers();
  }, []);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await appointmentApi.getAll();
      const data = response.data;
      setAppointments(data);
      
      setStats({
        total: data.length,
        pending: data.filter(a => a.status === 'pending').length,
        inSchool: data.filter(a => a.status === 'checked_in').length,
        completed: data.filter(a => a.status === 'checked_out').length
      });
    } catch (error) {
      console.error('獲取數據失敗:', error);
      message.error('數據加載失敗');
    } finally {
      setLoading(false);
    }
  };

  const fetchUsers = async () => {
    try {
      const response = await userApi.getAll();
      setUsers(response.data);
    } catch (error) {
      console.error('獲取使用者失敗:', error);
    }
  };

  const handleLogout = () => {
    localStorage.removeItem('token');
    localStorage.removeItem('user');
    navigate('/');
    message.success('已登出管理系統');
  };

  const columns = [
    {
      title: '訪客姓名',
      dataIndex: 'name',
      key: 'name',
      render: (text, record) => (
        <Space>
          <Avatar src={record.photo ? `/${record.photo}` : null} icon={<UserCheck size={16} />} />
          <Text strong>{text}</Text>
        </Space>
      )
    },
    {
      title: '事由',
      dataIndex: 'reason',
      key: 'reason',
    },
    {
      title: '受訪者',
      dataIndex: 'teacher',
      key: 'teacher',
    },
    {
      title: '入校時間',
      dataIndex: 'checkin_time',
      key: 'checkin_time',
      render: (time) => time ? dayjs(time).format('YYYY-MM-DD HH:mm') : '-'
    },
    {
      title: '狀態',
      dataIndex: 'status',
      key: 'status',
      render: (status) => {
        let color = 'blue';
        let text = '待簽到';
        if (status === 'checked_in') {
          color = 'green';
          text = '在校中';
        } else if (status === 'checked_out') {
          color = 'gray';
          text = '已離校';
        }
        return <Tag color={color}>{text}</Tag>;
      }
    }
  ];

  const userColumns = [
    {
      title: '使用者名稱',
      dataIndex: 'username',
      key: 'username',
      render: (text) => <Text strong>{text}</Text>
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role) => {
        const colors = { admin: 'red', guard: 'green', teacher: 'orange', student: 'blue' };
        const names = { admin: '管理員', guard: '警衛', teacher: '老師', student: '學生' };
        return <Tag color={colors[role]}>{names[role] || role}</Tag>;
      }
    },
    {
      title: '學號/員工編號',
      dataIndex: 'student_id',
      key: 'student_id',
      render: (id) => id || '-'
    }
  ];

  return (
    <Layout className="min-h-screen bg-[#f0f2f5]">
      <Sider 
        breakpoint="lg" 
        collapsedWidth="0" 
        style={{ background: '#fff', boxShadow: '2px 0 8px 0 rgba(29,35,41,.05)', zIndex: 10 }}
      >
        <div className="p-6 text-center">
          <div className="w-16 h-16 bg-blue-600 rounded-2xl flex items-center justify-center mx-auto mb-4 shadow-lg shadow-blue-200">
            <ShieldCheck size={32} className="text-white" />
          </div>
          <Title level={4} className="!m-0 !text-gray-800">管理後台</Title>
          <Text type="secondary" className="text-[10px] uppercase tracking-wider font-bold text-gray-400">Campus Security</Text>
        </div>
        <Menu
          mode="inline"
          selectedKeys={[activeKey]}
          onClick={({ key }) => {
            if (key === '5') {
              navigate('/admin/settings');
            } else {
              setActiveKey(key);
            }
          }}
          style={{ borderRight: 0 }}
          items={[
            { key: '1', icon: <LayoutDashboard size={18} />, label: '儀表板' },
            { key: '2', icon: <UserCog size={18} />, label: '使用者管理' },
            { key: '3', icon: <History size={18} />, label: '歷史紀錄' },
            { key: '4', icon: <TrendingUp size={18} />, label: '數據統計' },
            { key: '5', icon: <Settings size={18} />, label: '系統帳號設定' },
          ]}
        />
        <div className="absolute bottom-6 left-0 right-0 px-4 flex flex-col gap-3">
          <Button 
            block 
            icon={<ArrowLeft size={18} />} 
            onClick={() => navigate('/')}
            className="rounded-xl h-11 border-blue-100 text-blue-600 hover:text-blue-700 hover:border-blue-300"
          >
            返回大廳
          </Button>
          <Button 
            block 
            danger 
            type="primary"
            ghost
            icon={<LogOut size={18} />} 
            onClick={handleLogout}
            className="rounded-xl h-11 border-red-200 hover:border-red-500"
          >
            登出系統
          </Button>
        </div>
      </Sider>
      <Layout>
        <Header style={{ background: '#fff', padding: '0 32px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', boxShadow: '0 1px 4px rgba(0,21,41,.08)', zIndex: 9 }}>
          <Title level={4} className="!m-0 !text-gray-800">
            {activeKey === '1' ? '系統概況' : '使用者管理'}
          </Title>
          <Space size="large">
            <div className="flex items-center gap-3">
              <div className="text-right">
                <Text strong className="block leading-none text-gray-800">{user.username}</Text>
                <Text className="text-[11px] text-blue-500 font-medium">超級管理員</Text>
              </div>
              <Avatar size="large" className="bg-blue-600 text-white shadow-md shadow-blue-100">
                {user.username?.[0]?.toUpperCase()}
              </Avatar>
            </div>
          </Space>
        </Header>
        <Content className="p-8">
          {activeKey === '1' ? (
            <>
              <Row gutter={[24, 24]} className="mb-8">
                <Col xs={24} sm={12} lg={6}>
                  <Card className="rounded-2xl shadow-sm border-none">
                    <Statistic 
                      title="今日總預約" 
                      value={stats.total} 
                      prefix={<ClipboardList className="text-blue-500 mr-2" />} 
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Card className="rounded-2xl shadow-sm border-none">
                    <Statistic 
                      title="待簽到人數" 
                      value={stats.pending} 
                      valueStyle={{ color: '#3f8600' }}
                      prefix={<Users className="text-green-500 mr-2" />} 
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Card className="rounded-2xl shadow-sm border-none">
                    <Statistic 
                      title="目前在校" 
                      value={stats.inSchool} 
                      valueStyle={{ color: '#cf1322' }}
                      prefix={<UserCheck className="text-red-500 mr-2" />} 
                    />
                  </Card>
                </Col>
                <Col xs={24} sm={12} lg={6}>
                  <Card className="rounded-2xl shadow-sm border-none">
                    <Statistic 
                      title="已完成離校" 
                      value={stats.completed} 
                      prefix={<History className="text-gray-500 mr-2" />} 
                    />
                  </Card>
                </Col>
              </Row>

              <Card className="rounded-2xl shadow-sm border-none" title="最近訪客動態">
                <Table 
                  columns={columns} 
                  dataSource={appointments} 
                  rowKey="id" 
                  loading={loading}
                  pagination={{ pageSize: 5 }}
                />
              </Card>
            </>
          ) : activeKey === '2' ? (
            <Card className="rounded-2xl shadow-sm border-none" title="使用者清單">
              <Table 
                columns={userColumns} 
                dataSource={users} 
                rowKey="id" 
                loading={loading}
                pagination={{ pageSize: 10 }}
              />
            </Card>
          ) : (
            <Card className="rounded-2xl shadow-sm border-none">
              <Empty description="此功能開發中" />
            </Card>
          )}
        </Content>
      </Layout>
    </Layout>
  );
};

export default AdminDashboard;
