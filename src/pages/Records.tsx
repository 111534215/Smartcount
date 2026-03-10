import React, { useState, useEffect } from 'react';
import { 
  Table, 
  Tag, 
  Button, 
  Card, 
  Typography, 
  Modal, 
  message, 
  Space,
  Empty,
  Radio,
  Select
} from 'antd';
import { useNavigate } from 'react-router-dom';
import { ArrowLeft, QrCode, User, Clock, Phone, Filter, SortAsc, SortDesc } from 'lucide-react';
import { appointmentApi } from '../api/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;
const { Option } = Select;

const Records = () => {
  const [appointments, setAppointments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [qrModalVisible, setQrModalVisible] = useState(false);
  const [selectedAppointmentId, setSelectedAppointmentId] = useState(null);
  const [filterStatus, setFilterStatus] = useState('all');
  const [sortField, setSortField] = useState('created_at');
  const [sortOrder, setSortOrder] = useState('desc');
  const navigate = useNavigate();

  const fetchAppointments = async () => {
    setLoading(true);
    try {
      const response = await appointmentApi.getAll();
      setAppointments(response.data);
    } catch (error) {
      console.error('獲取紀錄失敗:', error);
      message.error('無法載入預約紀錄');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchAppointments();
  }, []);

  const getProcessedData = () => {
    // 1. Filter
    let result = appointments.filter(item => {
      if (filterStatus === 'all') return true;
      return item.status === filterStatus;
    });

    // 2. Sort
    result.sort((a, b) => {
      const valA = dayjs(a[sortField]).unix();
      const valB = dayjs(b[sortField]).unix();
      
      if (sortOrder === 'asc') {
        return valA - valB;
      } else {
        return valB - valA;
      }
    });

    return result;
  };

  const filteredAndSortedAppointments = getProcessedData();

  const showQrCode = (id) => {
    setSelectedAppointmentId(id);
    setQrModalVisible(true);
  };

  const getStatusTag = (status) => {
    switch (status) {
      case 'pending':
        return <Tag color="blue">已預約</Tag>;
      case 'checked_in':
        return <Tag color="green">已簽到</Tag>;
      case 'checked_out':
        return <Tag color="gray">已離校</Tag>;
      case 'cancelled':
        return <Tag color="red">已取消</Tag>;
      default:
        return <Tag>{status}</Tag>;
    }
  };

  const columns = [
    {
      title: '訪客資訊',
      key: 'visitor',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text strong><User size={14} className="inline mr-1" />{record.name}</Text>
          <Text type="secondary" className="text-xs"><Phone size={12} className="inline mr-1" />{record.phone}</Text>
        </Space>
      ),
    },
    {
      title: '來訪時間',
      key: 'time',
      render: (_, record) => (
        <Space direction="vertical" size={0}>
          <Text className="text-xs"><Clock size={12} className="inline mr-1" />{dayjs(record.visit_time).format('MM/DD HH:mm')}</Text>
          <Text type="secondary" className="text-xs">至 {dayjs(record.leave_time).format('HH:mm')}</Text>
        </Space>
      ),
    },
    {
      title: '受訪對象',
      dataIndex: 'teacher',
      key: 'teacher',
      render: (text) => text || <Text type="secondary">無 (臨時入校)</Text>,
    },
    {
      title: '狀態/時間',
      key: 'status_time',
      render: (_, record: any) => (
        <Space direction="vertical" size={0}>
          {getStatusTag(record.status)}
          {record.checkin_time && (
            <Text className="text-[10px] text-green-600">
              入: {dayjs(record.checkin_time).format('HH:mm')}
            </Text>
          )}
          {record.checkout_time && (
            <Text className="text-[10px] text-gray-500">
              出: {dayjs(record.checkout_time).format('HH:mm')}
            </Text>
          )}
        </Space>
      ),
    },
    {
      title: '操作',
      key: 'action',
      render: (_, record) => (
        <Space size="middle">
          {record.status === 'pending' && (
            <Button 
              type="primary" 
              icon={<QrCode size={16} className="inline mr-1" />}
              onClick={() => showQrCode(record.id)}
              size="small"
            >
              顯示 QR
            </Button>
          )}
          {record.status === 'checked_in' && (
            <Text type="success" className="text-xs">已進入</Text>
          )}
        </Space>
      ),
    },
  ];

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-4xl mx-auto">
        <Button 
          type="text" 
          icon={<ArrowLeft size={16} />} 
          onClick={() => navigate('/')}
          className="mb-4"
        >
          返回大廳
        </Button>

        <Card className="shadow-md border-none">
          <div className="flex flex-col gap-6 mb-6">
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
              <Title level={2} className="!mb-0">訪客預約紀錄</Title>
              <Button type="default" icon={<Filter size={16} className="inline mr-1" />} onClick={fetchAppointments}>重新整理</Button>
            </div>

            <div className="flex flex-col lg:flex-row justify-between items-start lg:items-center gap-4 bg-gray-50 p-4 rounded-lg">
              <Space direction="vertical" size={4} className="w-full lg:w-auto">
                <Text type="secondary" className="text-xs">狀態篩選</Text>
                <Radio.Group 
                  value={filterStatus} 
                  onChange={(e) => setFilterStatus(e.target.value)}
                  optionType="button"
                  buttonStyle="solid"
                  size="middle"
                  className="w-full"
                >
                  <Radio.Button value="all">全部</Radio.Button>
                  <Radio.Button value="pending">已預約</Radio.Button>
                  <Radio.Button value="checked_in">已簽到</Radio.Button>
                  <Radio.Button value="checked_out">已離校</Radio.Button>
                </Radio.Group>
              </Space>

              <div className="flex flex-wrap items-center gap-4 w-full lg:w-auto">
                <Space direction="vertical" size={4}>
                  <Text type="secondary" className="text-xs">排序欄位</Text>
                  <Select 
                    value={sortField} 
                    onChange={setSortField} 
                    style={{ width: 140 }}
                    size="middle"
                  >
                    <Option value="created_at">建立時間</Option>
                    <Option value="visit_time">來訪時間</Option>
                  </Select>
                </Space>

                <Space direction="vertical" size={4}>
                  <Text type="secondary" className="text-xs">排序方式</Text>
                  <Radio.Group 
                    value={sortOrder} 
                    onChange={(e) => setSortOrder(e.target.value)}
                    size="middle"
                  >
                    <Radio.Button value="desc"><Space><SortDesc size={14} />降冪</Space></Radio.Button>
                    <Radio.Button value="asc"><Space><SortAsc size={14} />升冪</Space></Radio.Button>
                  </Radio.Group>
                </Space>
              </div>
            </div>
          </div>

          <Table 
            columns={columns} 
            dataSource={filteredAndSortedAppointments} 
            rowKey="id" 
            loading={loading}
            pagination={{ pageSize: 10 }}
            locale={{ emptyText: <Empty description={filterStatus === 'all' ? "尚無預約紀錄" : "查無此狀態的紀錄"} /> }}
            scroll={{ x: 600 }}
          />
        </Card>

        {/* QR Code 彈窗 */}
        <Modal
          title="訪客通行 QR Code"
          open={qrModalVisible}
          onCancel={() => setQrModalVisible(false)}
          footer={[
            <Button key="close" onClick={() => setQrModalVisible(false)}>
              關閉
            </Button>
          ]}
          centered
          width={350}
        >
          <div className="text-center p-4">
            <Text type="secondary" className="block mb-4">請向警衛出示此 QR Code 進行簽到</Text>
            {selectedAppointmentId && (
              <div className="bg-white p-4 inline-block rounded-lg shadow-inner border">
                <img 
                  src={appointmentApi.getQrCodeUrl(selectedAppointmentId)} 
                  alt="QR Code" 
                  className="w-64 h-64"
                  referrerPolicy="no-referrer"
                />
              </div>
            )}
            <div className="mt-4">
              <Text strong className="text-lg">ID: {selectedAppointmentId}</Text>
            </div>
          </div>
        </Modal>
      </div>
    </div>
  );
};

export default Records;
