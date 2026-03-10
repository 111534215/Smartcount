import React, { useState } from 'react';
import { Form, Input, Button, Card, Typography, message } from 'antd';
import { useNavigate } from 'react-router-dom';
import { ShieldCheck, User, Lock } from 'lucide-react';
import { userApi } from '../api/api';

const { Title, Text } = Typography;

const Login = () => {
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const onFinish = async (values) => {
    setLoading(true);
    try {
      const response = await userApi.login(values);
      const { access_token, user } = response.data;
      
      // 儲存登入資訊
      localStorage.setItem('token', access_token);
      localStorage.setItem('user', JSON.stringify(user));
      
      message.success('登入成功！');
      navigate('/');
    } catch (error) {
      console.error('登入失敗:', error);
      message.error('帳號或密碼錯誤');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col items-center justify-center p-4">
      <Card className="w-full max-w-md shadow-lg border-none">
        <div className="text-center mb-8">
          <div className="flex justify-center mb-4 text-blue-600">
            <ShieldCheck size={64} />
          </div>
          <Title level={2}>管理員 / 警衛登入</Title>
          <Text type="secondary">請輸入您的帳號密碼以存取系統</Text>
        </div>

        <Form
          name="login"
          layout="vertical"
          onFinish={onFinish}
          autoComplete="off"
        >
          <Form.Item
            label="帳號"
            name="username"
            rules={[{ required: true, message: '請輸入帳號' }]}
          >
            <Input prefix={<User size={18} className="text-gray-400" />} placeholder="請輸入帳號" size="large" />
          </Form.Item>

          <Form.Item
            label="密碼"
            name="password"
            rules={[{ required: true, message: '請輸入密碼' }]}
          >
            <Input.Password prefix={<Lock size={18} className="text-gray-400" />} placeholder="請輸入密碼" size="large" />
          </Form.Item>

          <Form.Item className="mt-8">
            <Button type="primary" htmlType="submit" block size="large" loading={loading}>
              登入系統
            </Button>
          </Form.Item>
        </Form>
        
        <div className="text-center mt-4">
          <Button type="link" onClick={() => navigate('/')}>返回大廳</Button>
        </div>
      </Card>
      
      <div className="mt-8 text-gray-400 text-sm">
        預設測試帳號: admin / admin123
      </div>
    </div>
  );
};

export default Login;
