import React, { useState, useEffect } from 'react';
import { 
  Card, 
  Typography, 
  Button, 
  Table, 
  Tag, 
  Modal, 
  Input, 
  message, 
  Space,
  Divider,
  Form
} from 'antd';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Settings, 
  Key, 
  User, 
  ShieldCheck, 
  GraduationCap, 
  Users
} from 'lucide-react';
import { userApi } from '../api/api';

const { Title, Text } = Typography;

const AdminSettings = () => {
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(false);
  const [passwordModalVisible, setPasswordModalVisible] = useState(false);
  const [selectedUser, setSelectedUser] = useState(null);
  const [form] = Form.useForm();
  const navigate = useNavigate();

  const fetchUsers = async () => {
    setLoading(true);
    try {
      const response = await userApi.getAll();
      setUsers(response.data);
    } catch (error) {
      console.error('獲取使用者失敗:', error);
      message.error('無法獲取使用者清單');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUsers();
  }, []);

  const handleUpdatePassword = async (values) => {
    try {
      await userApi.updatePassword(selectedUser.id, values.password);
      message.success(`使用者「${selectedUser.username}」的密碼已成功更新`);
      setPasswordModalVisible(false);
      form.resetFields();
    } catch (error) {
      console.error('更新密碼失敗:', error);
      message.error('更新密碼失敗，請稍後再試');
    }
  };

  const columns = [
    {
      title: '使用者名稱',
      dataIndex: 'username',
      key: 'username',
      render: (text, record) => (
        <Space>
          {record.role === 'admin' && <ShieldCheck size={16} className="text-red-500" />}
          {record.role === 'guard' && <ShieldCheck size={16} className="text-blue-500" />}
          {record.role === 'teacher' && <User size={16} className="text-green-500" />}
          {record.role === 'student' && <GraduationCap size={16} className="text-amber-500" />}
          <Text strong>{text}</Text>
        </Space>
      )
    },
    {
      title: '角色',
      dataIndex: 'role',
      key: 'role',
      render: (role) => {
        const roles = {
          admin: { color: 'red', label: '管理員' },
          guard: { color: 'blue', label: '警衛' },
          teacher: { color: 'green', label: '老師' },
          student: { color: 'orange', label: '學生' }
        };
        const r = roles[role] || { color: 'default', label: role };
        return <Tag color={r.color}>{r.label}</Tag>;
      }
    },
    {
      title: '學號/工號',
      dataIndex: 'student_id',
      key: 'student_id',
      render: (id) => id || '-'
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Button 
          type="link" 
          icon={<Key size={14} className="mr-1" />}
          onClick={() => {
            setSelectedUser(record);
            setPasswordModalVisible(true);
          }}
        >
          修改密碼
        </Button>
      )
    }
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <div className="flex justify-between items-center mb-6">
          <Button 
            type="text" 
            icon={<ArrowLeft size={16} />} 
            onClick={() => navigate('/admin')}
          >
            返回後台
          </Button>
          <Title level={3} className="!m-0 flex items-center gap-2">
            <Settings size={24} className="text-gray-600" />
            系統帳號設定
          </Title>
        </div>

        <Card className="shadow-md border-none">
          <div className="mb-6">
            <Title level={4}>帳號管理</Title>
            <Text type="secondary">管理校園系統中的預設帳號，包含警衛、老師與學生帳號的密碼修改。</Text>
          </div>

          <Table 
            columns={columns} 
            dataSource={users} 
            rowKey="id" 
            loading={loading}
            pagination={false}
            className="border border-gray-100 rounded-lg overflow-hidden"
          />
        </Card>

        <Modal
          title={`修改密碼 - ${selectedUser?.username}`}
          open={passwordModalVisible}
          onCancel={() => {
            setPasswordModalVisible(false);
            form.resetFields();
          }}
          onOk={() => form.submit()}
          okText="確認修改"
          cancelText="取消"
          centered
        >
          <Form
            form={form}
            layout="vertical"
            onFinish={handleUpdatePassword}
            className="mt-4"
          >
            <Form.Item
              name="password"
              label="新密碼"
              rules={[
                { required: true, message: '請輸入新密碼' },
                { min: 6, message: '密碼長度至少 6 個字元' }
              ]}
            >
              <Input.Password prefix={<Key size={16} className="text-gray-400 mr-2" />} placeholder="請輸入新密碼" />
            </Form.Item>
            <Form.Item
              name="confirm"
              label="確認新密碼"
              dependencies={['password']}
              rules={[
                { required: true, message: '請再次輸入新密碼' },
                ({ getFieldValue }) => ({
                  validator(_, value) {
                    if (!value || getFieldValue('password') === value) {
                      return Promise.resolve();
                    }
                    return Promise.reject(new Error('兩次輸入的密碼不一致'));
                  },
                }),
              ]}
            >
              <Input.Password prefix={<Key size={16} className="text-gray-400 mr-2" />} placeholder="請再次輸入新密碼" />
            </Form.Item>
          </Form>
        </Modal>
      </div>
    </div>
  );
};

export default AdminSettings;
