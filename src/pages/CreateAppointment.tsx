import React, { useState } from 'react';
import { 
  Form, 
  Input, 
  Button, 
  DatePicker, 
  Select, 
  Checkbox, 
  Card, 
  Typography, 
  message, 
  Space,
  Badge,
  Modal
} from 'antd';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Calendar, 
  Clock, 
  Briefcase, 
  Users, 
  School, 
  Box, 
  IdCard, 
  Pencil,
  User,
  Phone
} from 'lucide-react';
import { appointmentApi } from '../api/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { TextArea } = Input;

const CreateAppointment = () => {
  const [form] = Form.useForm();
  const navigate = useNavigate();
  const [loading, setLoading] = useState(false);
  const [selectedReason, setSelectedReason] = useState('');

  // 預設的來訪理由與圖示
  const reasonOptions = [
    { label: '公務洽談', value: '公務洽談', icon: <Briefcase size={32} /> },
    { label: '接送學生', value: '接送學生', icon: <Users size={32} /> },
    { label: '參觀校園', value: '參觀校園', icon: <School size={32} /> },
    { label: '忘帶學生證', value: '忘帶學生證', icon: <IdCard size={32} />, special: true },
    { label: '其他事由', value: '其他', icon: <Pencil size={32} /> },
  ];

  // 預設的受訪老師 (未來可以從 API 取得)
  const teachers = [
    '王小明 (教務處)',
    '李大華 (學務處)',
    '張美玲 (總務處)',
    '陳主任 (校長室)'
  ];

  // 禁用過去的日期
  const disabledDate = (current) => {
    return current && current < dayjs().startOf('day');
  };

  // 禁用過去的時間 (針對今天)
  const disabledDateTime = (current) => {
    if (current && current.isSame(dayjs(), 'day')) {
      const now = dayjs();
      return {
        disabledHours: () => Array.from({ length: 24 }, (_, i) => i).filter(h => h < now.hour()),
        disabledMinutes: (selectedHour) => {
          if (selectedHour === now.hour()) {
            return Array.from({ length: 60 }, (_, i) => i).filter(m => m < now.minute());
          }
          return [];
        },
      };
    }
    return {};
  };

  const onFinish = async (values) => {
    setLoading(true);
    try {
      // 格式化時間為後端需要的 ISO 格式
      const payload = {
        ...values,
        visit_time: values.visit_time.toISOString(),
        leave_time: values.leave_time ? values.leave_time.toISOString() : null,
        // 如果是忘記帶學生證，理由加上標記
        reason: selectedReason === '忘帶學生證' ? `[忘記帶學生證] ${values.custom_reason || ''}` : (selectedReason === '其他' ? values.custom_reason : selectedReason),
      };

      const response = await appointmentApi.create(payload);
      const newAppointment = response.data;
      
      Modal.success({
        title: '預約成功！',
        width: 400,
        centered: true,
        content: (
          <div className="text-center py-4">
            <Text type="secondary" className="block mb-4">請截圖保存此 QR Code，入校與離校時請出示給警衛掃描。</Text>
            <div className="bg-white p-4 rounded-xl border border-gray-100 inline-block">
              <img 
                src={`/api/appointments/${newAppointment.id}/qrcode`} 
                alt="QR Code" 
                className="w-48 h-48 mx-auto"
                referrerPolicy="no-referrer"
              />
              <Title level={4} className="!mt-4 !mb-0">編號: {newAppointment.id}</Title>
            </div>
            <div className="mt-6 text-left bg-gray-50 p-4 rounded-lg text-xs">
              <p><strong>訪客:</strong> {newAppointment.name}</p>
              <p><strong>時間:</strong> {dayjs(newAppointment.visit_time).format('YYYY/MM/DD HH:mm')}</p>
              <p><strong>事由:</strong> {newAppointment.reason}</p>
            </div>
          </div>
        ),
        okText: '返回大廳',
        onOk: () => navigate('/'),
      });
    } catch (error) {
      console.error('預約失敗:', error);
      const errorMsg = error.response?.data?.detail || error.response?.data?.message || error.message || '預約失敗，請稍後再試';
      message.error(errorMsg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <Button 
          type="text" 
          icon={<ArrowLeft size={16} />} 
          onClick={() => navigate('/')}
          className="mb-4"
        >
          返回大廳
        </Button>

        <Card className="shadow-md border-none">
          <Title level={2} className="text-center !mb-8">訪客預約登記</Title>

          <Form
            form={form}
            layout="vertical"
            onFinish={onFinish}
            initialValues={{
              visit_time: dayjs(),
              leave_time: dayjs().add(1, 'hour'),
            }}
            requiredMark={false}
          >
            <div className="mb-8">
              <Title level={5} className="!mb-4 text-gray-500 font-bold">基本資料</Title>
              <Form.Item
                label={<Space className="font-bold"><User size={18} className="text-gray-400" />姓名 <Text type="danger">*</Text></Space>}
                name="name"
                rules={[{ required: true, message: '請輸入姓名' }]}
              >
                <Input placeholder="請輸入您的姓名" size="large" className="rounded-xl h-14" />
              </Form.Item>

              <Form.Item
                label={<Space className="font-bold"><Phone size={18} className="text-gray-400" />聯絡電話 <Text type="danger">*</Text></Space>}
                name="phone"
                rules={[{ required: true, message: '請輸入電話' }]}
              >
                <Input placeholder="例：0912-345-678" size="large" className="rounded-xl h-14" />
              </Form.Item>
            </div>

            <div className="mb-8">
              <Title level={5} className="!mb-4 text-gray-500 font-bold">來訪時間</Title>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-x-6">
                <Form.Item
                  label={<Space className="font-bold"><Calendar size={18} className="text-gray-400" />預計入校時間 <Text type="danger">*</Text></Space>}
                  name="visit_time"
                  rules={[{ required: true, message: '請選擇時間' }]}
                >
                  <DatePicker 
                    showTime 
                    className="w-full rounded-xl h-14" 
                    size="large" 
                    placeholder="yyyy/月/dd -- : --"
                    disabledDate={disabledDate}
                    disabledTime={disabledDateTime}
                  />
                </Form.Item>

                <Form.Item
                  label={<Space className="font-bold"><Clock size={18} className="text-gray-400" />預計離校時間</Space>}
                  name="leave_time"
                  extra={<Text type="secondary" className="text-xs">可選填</Text>}
                >
                  <DatePicker 
                    showTime 
                    className="w-full rounded-xl h-14" 
                    size="large" 
                    placeholder="yyyy/月/dd -- : --"
                    disabledDate={disabledDate}
                    disabledTime={disabledDateTime}
                  />
                </Form.Item>
              </div>
            </div>

            <div className="mb-8">
              <Title level={5} className="!mb-4 text-gray-500 font-bold">來訪事由</Title>
              <Form.Item
                name="reason_selection"
                rules={[{ required: true, message: '請選擇一個事由' }]}
                noStyle
              >
                <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                  {reasonOptions.map((option) => (
                    <div 
                      key={option.value}
                      className={`relative cursor-pointer border-2 rounded-xl p-6 flex flex-col items-center justify-center transition-all ${
                        selectedReason === option.value 
                        ? 'border-blue-500 bg-blue-50 text-blue-600' 
                        : 'border-gray-100 hover:border-blue-300 bg-white text-gray-600'
                      }`}
                      onClick={() => {
                        setSelectedReason(option.value);
                        form.setFieldsValue({ reason_selection: option.value });
                      }}
                    >
                      {option.special && (
                        <div className="absolute -top-2 -right-2">
                          <Badge count="特殊" style={{ backgroundColor: '#faad14' }} />
                        </div>
                      )}
                      <div className={`mb-3 ${selectedReason === option.value ? 'text-blue-500' : 'text-gray-400'}`}>
                        {option.icon}
                      </div>
                      <Text strong className={selectedReason === option.value ? 'text-blue-600' : 'text-gray-600'}>
                        {option.label}
                      </Text>
                    </div>
                  ))}
                </div>
              </Form.Item>
            </div>

            <div className="mb-8">
              <Title level={5} className="!mb-4 text-gray-500 font-bold">受訪對象</Title>
              <Form.Item
                name="teacher"
                rules={[{ 
                  required: !['忘帶學生證', '接送學生', '參觀校園'].includes(selectedReason), 
                  message: '請選擇受訪老師' 
                }]}
              >
                <Select 
                  placeholder="-- 請選擇受訪老師或單位 --" 
                  size="large" 
                  className="w-full h-14 rounded-xl"
                  dropdownStyle={{ borderRadius: '12px' }}
                >
                  {teachers.map(t => <Select.Option key={t} value={t}>{t}</Select.Option>)}
                </Select>
              </Form.Item>
            </div>

            <div className="mb-8">
              <Title level={5} className="!mb-4 text-gray-500 font-bold">備註</Title>
              <Form.Item
                name="custom_reason"
                rules={[{ required: selectedReason === '其他', message: '請填寫說明' }]}
                extra={<Text type="secondary" className="text-xs">可選填</Text>}
              >
                <TextArea 
                  rows={4} 
                  placeholder="其他需要說明的事項..." 
                  className="rounded-xl p-4"
                />
              </Form.Item>
            </div>

            <Form.Item className="mt-10">
              <Button 
                type="primary" 
                htmlType="submit" 
                block 
                size="large" 
                loading={loading}
                className="h-16 text-xl font-bold rounded-2xl bg-blue-700 hover:bg-blue-800 border-none shadow-lg"
              >
                確認送出預約
              </Button>
            </Form.Item>
          </Form>
        </Card>
      </div>
    </div>
  );
};

export default CreateAppointment;
