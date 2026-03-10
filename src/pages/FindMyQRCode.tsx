import React, { useState } from 'react';
import { 
  Input, 
  Button, 
  Card, 
  Typography, 
  message, 
  Space,
  Divider,
  Result,
  Modal
} from 'antd';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Search, 
  QrCode,
  Phone,
  Download
} from 'lucide-react';
import { appointmentApi } from '../api/api';
import { QRCodeSVG } from 'qrcode.react';

const { Title, Text } = Typography;

const FindMyQRCode = () => {
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [appointment, setAppointment] = useState(null);
  const navigate = useNavigate();

  const handleSearch = async () => {
    if (!phone.trim()) {
      message.warning('請輸入預約時填寫的電話號碼');
      return;
    }

    setLoading(true);
    try {
      const response = await appointmentApi.findByPhone(phone);
      setAppointment(response.data);
      message.success('已找到您的預約紀錄');
    } catch (error) {
      console.error('查詢失敗:', error);
      const errorMsg = error.response?.data?.detail || error.response?.data?.message || error.message || '找不到該電話的有效預約紀錄';
      message.error(errorMsg);
      setAppointment(null);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8 flex flex-col items-center">
      <div className="max-w-md w-full">
        <Button 
          type="text" 
          icon={<ArrowLeft size={16} />} 
          onClick={() => navigate('/')}
          className="mb-4"
        >
          返回大廳
        </Button>

        <Card className="shadow-md border-none overflow-hidden">
          <div className="bg-indigo-600 p-6 -m-6 mb-6 text-center">
            <Title level={3} className="!text-white !m-0 flex items-center justify-center gap-2">
              <QrCode size={28} />
              找回我的 QR Code
            </Title>
          </div>

          {!appointment ? (
            <div className="py-4">
              <Text type="secondary" className="block mb-6 text-center">
                忘記截圖或遺失編號？請輸入預約時的電話號碼找回。
              </Text>
              
              <Space direction="vertical" size="large" className="w-full">
                <Input 
                  size="large" 
                  placeholder="請輸入電話號碼 (例如: 0912345678)" 
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  onPressEnter={handleSearch}
                  prefix={<Phone size={18} className="text-gray-400" />}
                  className="rounded-xl h-14"
                />
                
                <Button 
                  type="primary" 
                  size="large" 
                  block 
                  onClick={handleSearch} 
                  loading={loading}
                  className="h-14 rounded-xl font-bold bg-indigo-600 hover:bg-indigo-700 border-none"
                >
                  立即查詢
                </Button>
              </Space>

              <div className="mt-8 p-4 bg-amber-50 rounded-lg border border-amber-100">
                <Text type="warning" className="text-xs">
                  注意：系統僅會顯示「尚未簽到」的最新一筆預約。若您已入校或預約已過期，將無法透過此處查詢。
                </Text>
              </div>
            </div>
          ) : (
            <div className="text-center animate-in fade-in zoom-in duration-500">
              <Result
                status="success"
                title="查詢成功"
                subTitle={`訪客：${appointment.name}`}
              />
              
              <div className="bg-white p-6 rounded-2xl shadow-inner border border-gray-100 inline-block mb-6">
                <QRCodeSVG 
                  value={`visitor_app:${appointment.id}`} 
                  size={200}
                  level="H"
                  includeMargin={true}
                />
                <div className="mt-4">
                  <Text strong className="text-lg block">預約編號: {appointment.id}</Text>
                  <Text type="secondary" className="text-xs">請截圖保存此 QR Code 以便入校簽到</Text>
                </div>
              </div>

              <div className="flex gap-2">
                <Button 
                  block 
                  size="large" 
                  onClick={() => setAppointment(null)}
                  className="rounded-xl h-12"
                >
                  重新查詢
                </Button>
                <Button 
                  type="primary"
                  block 
                  size="large" 
                  icon={<Download size={18} />}
                  onClick={() => window.print()}
                  className="rounded-xl h-12 bg-indigo-600 border-none"
                >
                  列印憑證
                </Button>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
};

export default FindMyQRCode;
