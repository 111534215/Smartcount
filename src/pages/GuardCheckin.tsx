import React, { useState, useEffect, useRef } from 'react';
import { 
  Input, 
  Button, 
  Card, 
  Typography, 
  message, 
  Space,
  Descriptions,
  Upload,
  Divider,
  Tag,
  List,
  Avatar,
  Modal
} from 'antd';
import { useNavigate } from 'react-router-dom';
import { 
  ArrowLeft, 
  Camera, 
  ShieldCheck, 
  Search, 
  CheckCircle, 
  LogOut, 
  User, 
  Clock,
  RefreshCw,
  X,
  QrCode
} from 'lucide-react';
import { Html5QrcodeScanner } from 'html5-qrcode';
import { appointmentApi } from '../api/api';
import dayjs from 'dayjs';

const { Title, Text } = Typography;

const CameraModal = ({ visible, onCancel, onCapture }) => {
  const videoRef = useRef(null);
  const [stream, setStream] = useState(null);

  useEffect(() => {
    if (visible) {
      startCamera();
    } else {
      stopCamera();
    }
    return () => stopCamera();
  }, [visible]);

  const startCamera = async () => {
    try {
      const s = await navigator.mediaDevices.getUserMedia({ video: { facingMode: 'environment' } });
      setStream(s);
      if (videoRef.current) {
        videoRef.current.srcObject = s;
      }
    } catch (err) {
      console.error("Error accessing camera:", err);
      message.error("無法存取攝影機，請檢查權限設定");
      onCancel();
    }
  };

  const stopCamera = () => {
    if (stream) {
      stream.getTracks().forEach(track => track.stop());
      setStream(null);
    }
  };

  const capture = () => {
    const video = videoRef.current;
    if (!video) return;
    const canvas = document.createElement('canvas');
    canvas.width = video.videoWidth;
    canvas.height = video.videoHeight;
    const ctx = canvas.getContext('2d');
    ctx.drawImage(video, 0, 0, canvas.width, canvas.height);
    
    canvas.toBlob((blob) => {
      const file = new File([blob], "capture.jpg", { type: "image/jpeg" });
      onCapture(file, canvas.toDataURL('image/jpeg'));
      onCancel();
    }, 'image/jpeg');
  };

  return (
    <Modal
      title="拍攝訪客照片"
      open={visible}
      onCancel={onCancel}
      footer={null}
      centered
      width={400}
      destroyOnClose
    >
      <div className="relative bg-black rounded-lg overflow-hidden aspect-square flex items-center justify-center">
        <video 
          ref={videoRef} 
          autoPlay 
          playsInline 
          className="w-full h-full object-cover"
        />
        <div className="absolute bottom-4 left-0 right-0 flex justify-center">
          <Button 
            type="primary" 
            shape="circle" 
            size="large" 
            icon={<Camera size={24} />} 
            onClick={capture}
            className="h-16 w-16 bg-white text-blue-600 border-none shadow-xl flex items-center justify-center"
          />
        </div>
      </div>
    </Modal>
  );
};

const QRScannerModal = ({ visible, onCancel, onScan }) => {
  useEffect(() => {
    let scanner = null;
    let timeoutId = null;

    if (visible) {
      // 使用 setTimeout 確保 Modal 的 DOM 元素已經渲染完成
      timeoutId = setTimeout(() => {
        const element = document.getElementById("qr-reader");
        if (!element) {
          console.error("QR reader element not found");
          return;
        }

        scanner = new Html5QrcodeScanner("qr-reader", { 
          fps: 10, 
          qrbox: { width: 250, height: 250 },
          rememberLastUsedCamera: true,
          supportedScanTypes: [0] // 0 is Html5QrcodeScanType.SCAN_TYPE_CAMERA
        }, false);
        
        scanner.render((decodedText) => {
          onScan(decodedText);
          scanner.clear();
        }, (error) => {
          // Silently ignore scan errors
        });
      }, 300); // 延遲 300ms 等待 Modal 動畫
    }

    return () => {
      if (timeoutId) clearTimeout(timeoutId);
      if (scanner) {
        scanner.clear().catch(error => console.error("Failed to clear scanner", error));
      }
    };
  }, [visible]);

  return (
    <Modal
      title="掃描訪客 QR Code"
      open={visible}
      onCancel={onCancel}
      footer={null}
      centered
      width={400}
      destroyOnClose
    >
      <div id="qr-reader" className="w-full"></div>
      <div className="mt-4 text-center text-gray-500 text-xs">
        請將訪客的預約 QR Code 對準掃描框
      </div>
    </Modal>
  );
};

const GuardCheckin = () => {
  const [appointmentId, setAppointmentId] = useState('');
  const [appointment, setAppointment] = useState(null);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [photoFile, setPhotoFile] = useState(null);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [activeAppointments, setActiveAppointments] = useState([]);
  const [cameraVisible, setCameraVisible] = useState(false);
  const [qrScannerVisible, setQrScannerVisible] = useState(false);
  const [searchModalVisible, setSearchModalVisible] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState([]);
  const [searching, setSearching] = useState(false);
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || '{}');

  const fetchActiveAppointments = async () => {
    try {
      const response = await appointmentApi.getAll();
      const active = response.data.filter(a => a.status === 'checked_in');
      setActiveAppointments(active);
    } catch (error) {
      console.error('獲取在校訪客失敗:', error);
    }
  };

  const handleManualSearch = async () => {
    if (!searchQuery.trim()) {
      message.warning('請輸入姓名或電話');
      return;
    }
    setSearching(true);
    try {
      const response = await appointmentApi.search(searchQuery);
      setSearchResults(response.data);
      if (response.data.length === 0) {
        message.info('找不到符合的預約紀錄');
      }
    } catch (error) {
      console.error('搜尋失敗:', error);
      message.error('搜尋出錯，請稍後再試');
    } finally {
      setSearching(false);
    }
  };

  const selectAppointment = (appt) => {
    setAppointment(appt);
    setAppointmentId(appt.id.toString());
    setSearchModalVisible(false);
    setSearchQuery('');
    setSearchResults([]);
  };

  React.useEffect(() => {
    fetchActiveAppointments();
  }, []);

  const handleSearch = async (id?: any) => {
    const searchId = (typeof id === 'string' ? id : appointmentId).trim();
    if (!searchId) {
      message.warning('請輸入預約編號');
      return;
    }

    setLoading(true);
    try {
      // Handle QR code prefix if scanned
      const cleanId = searchId.startsWith('visitor_app:') ? searchId.split(':')[1] : searchId;
      const response = await appointmentApi.getById(cleanId);
      setAppointment(response.data);
      if (response.data.status === 'checked_out') {
        message.info('此訪客已離校');
      }
    } catch (error) {
      console.error('查詢失敗:', error);
      message.error('找不到該預約紀錄');
      setAppointment(null);
    } finally {
      setLoading(false);
    }
  };

  const handlePhotoCapture = (file, url) => {
    setPhotoFile(file);
    setPreviewUrl(url);
  };

  const handleCheckin = async () => {
    if (!photoFile) {
      message.error('請先拍攝訪客照片');
      return;
    }

    Modal.confirm({
      title: '確認簽到',
      content: `確定要為訪客「${appointment.name}」辦理入校簽到嗎？`,
      okText: '確認簽到',
      cancelText: '取消',
      onOk: async () => {
        setSubmitting(true);
        try {
          await appointmentApi.checkin(appointment.id, photoFile);
          message.success('簽到成功！訪客已入校');
          setAppointment(null);
          setAppointmentId('');
          setPhotoFile(null);
          setPreviewUrl(null);
          fetchActiveAppointments();
        } catch (error) {
          console.error('簽到失敗:', error);
          message.error('簽到失敗，請檢查網路連線');
        } finally {
          setSubmitting(false);
        }
      }
    });
  };

  const handleCheckout = async (id?: any) => {
    const targetId = typeof id === 'string' ? id : appointment?.id;
    if (!targetId) return;

    Modal.confirm({
      title: '確認簽退',
      content: '確定訪客已準備離校？此操作將記錄目前的離校時間。',
      okText: '確認離校',
      okType: 'danger',
      cancelText: '取消',
      onOk: async () => {
        setSubmitting(true);
        try {
          await appointmentApi.checkout(targetId);
          message.success('簽退成功！訪客已離校');
          setAppointment(null);
          setAppointmentId('');
          fetchActiveAppointments();
        } catch (error) {
          console.error('簽退失敗:', error);
          message.error('簽退失敗');
        } finally {
          setSubmitting(false);
        }
      }
    });
  };

  const handleQrScan = (decodedText) => {
    setQrScannerVisible(false);
    setAppointmentId(decodedText);
    handleSearch(decodedText);
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex justify-between items-center mb-4">
          <Button 
            type="text" 
            icon={<ArrowLeft size={16} />} 
            onClick={() => navigate('/')}
          >
            返回大廳
          </Button>
          {user.username && (
            <div className="flex items-center gap-2 bg-white px-3 py-1 rounded-full shadow-sm border border-gray-100">
              <div className="w-2 h-2 bg-green-500 rounded-full animate-pulse"></div>
              <Text className="text-xs font-medium text-gray-600">
                執勤中: {user.username} ({user.role === 'guard' ? '警衛' : '管理員'})
              </Text>
            </div>
          )}
        </div>

        <Card className="shadow-md border-none mb-6 overflow-hidden">
          <div className="bg-blue-600 p-4 -m-6 mb-6 text-center">
            <Title level={3} className="!text-white !m-0 flex items-center justify-center gap-2">
              <ShieldCheck size={28} />
              校園警衛簽到系統
            </Title>
          </div>

          <div className="flex flex-col gap-4 mb-8 mt-4">
            <div className="flex gap-2">
              <Input 
                size="large" 
                placeholder="請輸入預約編號" 
                value={appointmentId}
                onChange={(e) => setAppointmentId(e.target.value)}
                onPressEnter={() => handleSearch()}
                prefix={<Search size={18} className="text-gray-400" />}
                className="rounded-xl h-14"
              />
              <Button 
                type="primary" 
                size="large" 
                onClick={() => handleSearch()} 
                loading={loading}
                className="h-14 px-8 rounded-xl font-bold"
              >
                查詢
              </Button>
            </div>
            
            <div className="flex gap-2">
              <Button 
                icon={<QrCode size={20} />} 
                size="large" 
                className="flex-1 h-14 rounded-xl border-2 border-blue-500 text-blue-600 font-bold hover:bg-blue-50 flex items-center justify-center gap-2"
                onClick={() => setQrScannerVisible(true)}
              >
                掃描 QR Code
              </Button>
              <Button 
                icon={<Search size={20} />} 
                size="large" 
                className="flex-1 h-14 rounded-xl border-2 border-gray-300 text-gray-600 font-bold hover:bg-gray-50 flex items-center justify-center gap-2"
                onClick={() => setSearchModalVisible(true)}
              >
                忘記 QR Code？
              </Button>
            </div>
          </div>

          {appointment && (
            <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
              <div className="flex justify-between items-center mb-4">
                <Divider className="!m-0">預約資訊</Divider>
                <Button type="text" icon={<X size={16} />} onClick={() => setAppointment(null)} />
              </div>
              
              <Descriptions bordered column={1} size="small" className="mb-6 bg-white">
                <Descriptions.Item label="訪客姓名">{appointment.name}</Descriptions.Item>
                <Descriptions.Item label="電話">{appointment.phone}</Descriptions.Item>
                <Descriptions.Item label="受訪老師">{appointment.teacher || '無 (臨時入校)'}</Descriptions.Item>
                <Descriptions.Item label="來訪事由">{appointment.reason}</Descriptions.Item>
                <Descriptions.Item label="預計時間">
                  {dayjs(appointment.visit_time).format('MM/DD HH:mm')} ~ {dayjs(appointment.leave_time).format('HH:mm')}
                </Descriptions.Item>
                <Descriptions.Item label="目前狀態">
                  {appointment.status === 'pending' && <Tag color="blue">待簽到</Tag>}
                  {appointment.status === 'checked_in' && <Tag color="green">已入校</Tag>}
                  {appointment.status === 'checked_out' && <Tag color="gray">已離校</Tag>}
                </Descriptions.Item>
              </Descriptions>

              {appointment.status === 'pending' && (
                <div className="bg-blue-50 p-6 rounded-xl border border-blue-100 text-center">
                  <Title level={4} className="!mb-4 text-blue-800">簽到處理</Title>
                  
                  <div className="mb-6">
                    {previewUrl ? (
                      <div className="relative inline-block">
                        <img 
                          src={previewUrl} 
                          alt="Preview" 
                          className="w-64 h-64 object-cover rounded-xl border-4 border-white shadow-lg" 
                          referrerPolicy="no-referrer"
                        />
                        <Button 
                          type="primary" 
                          danger 
                          shape="circle" 
                          icon={<X size={16} />}
                          className="absolute -top-3 -right-3 flex items-center justify-center"
                          onClick={() => {
                            setPhotoFile(null);
                            setPreviewUrl(null);
                          }}
                        />
                      </div>
                    ) : (
                      <div 
                        className="h-48 w-full bg-white border-2 border-dashed border-blue-200 rounded-xl flex flex-col items-center justify-center gap-3 cursor-pointer hover:bg-blue-100 transition-colors"
                        onClick={() => setCameraVisible(true)}
                      >
                        <Camera size={48} className="text-blue-400" />
                        <Text className="text-blue-600 font-medium">點擊開啟相機拍攝訪客</Text>
                      </div>
                    )}
                  </div>

                  <Button 
                    type="primary" 
                    size="large" 
                    block 
                    icon={<CheckCircle size={20} className="inline mr-2" />}
                    onClick={handleCheckin}
                    loading={submitting}
                    disabled={!photoFile}
                    className="h-14 text-lg font-bold rounded-xl shadow-md"
                  >
                    確認簽到 (進入校園)
                  </Button>
                </div>
              )}

              {appointment.status === 'checked_in' && (
                <div className="bg-orange-50 p-6 rounded-xl border border-orange-100 text-center">
                  <Title level={4} className="!mb-4 text-orange-800">簽退處理</Title>
                  <Text className="block mb-6 text-orange-700">訪客目前正在校內，確認是否現在離校？</Text>
                  
                  <Button 
                    type="primary" 
                    danger
                    size="large" 
                    block 
                    icon={<LogOut size={20} className="inline mr-2" />}
                    onClick={() => handleCheckout()}
                    loading={submitting}
                    className="h-14 text-lg font-bold rounded-xl shadow-md bg-orange-600 hover:bg-orange-700 border-none"
                  >
                    確認簽退 (離開校園)
                  </Button>
                </div>
              )}
            </div>
          )}
        </Card>

        <Card className="shadow-md border-none" title={
          <div className="flex justify-between items-center">
            <Space><User size={18} className="text-blue-500" />目前在校訪客 ({activeAppointments.length})</Space>
            <Button type="text" icon={<RefreshCw size={16} />} onClick={fetchActiveAppointments} />
          </div>
        }>
          <List
            itemLayout="horizontal"
            dataSource={activeAppointments}
            locale={{ emptyText: '目前校內無訪客' }}
            renderItem={(item) => (
              <List.Item
                actions={[
                  <Button 
                    key="checkout" 
                    type="link" 
                    danger 
                    icon={<LogOut size={16} />}
                    onClick={() => handleCheckout(item.id)}
                  >
                    簽退
                  </Button>
                ]}
              >
                <List.Item.Meta
                  avatar={
                    <Avatar 
                      src={item.photo ? `/${item.photo}` : null} 
                      icon={<User />} 
                      size="large"
                      className="border border-gray-200"
                    />
                  }
                  title={<Text strong>{item.name}</Text>}
                  description={
                    <Space direction="vertical" size={0}>
                      <Text type="secondary" className="text-xs">事由: {item.reason}</Text>
                      <Text type="secondary" className="text-xs">
                        <Clock size={10} className="inline mr-1" />
                        簽到時間: {dayjs(item.checkin_time).format('HH:mm')}
                      </Text>
                    </Space>
                  }
                />
              </List.Item>
            )}
          />
        </Card>

        <CameraModal 
          visible={cameraVisible} 
          onCancel={() => setCameraVisible(false)} 
          onCapture={handlePhotoCapture} 
        />

        <QRScannerModal
          visible={qrScannerVisible}
          onCancel={() => setQrScannerVisible(false)}
          onScan={handleQrScan}
        />

        <Modal
          title="搜尋預約紀錄 (忘記 QR Code)"
          open={searchModalVisible}
          onCancel={() => {
            setSearchModalVisible(false);
            setSearchQuery('');
            setSearchResults([]);
          }}
          footer={null}
          width={500}
          centered
        >
          <div className="flex gap-2 mb-6">
            <Input 
              placeholder="請輸入訪客姓名或電話" 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onPressEnter={handleManualSearch}
              prefix={<Search size={16} className="text-gray-400" />}
              className="rounded-lg"
            />
            <Button type="primary" onClick={handleManualSearch} loading={searching}>搜尋</Button>
          </div>

          <List
            dataSource={searchResults}
            locale={{ emptyText: searchQuery ? '找不到符合的紀錄' : '請輸入關鍵字進行搜尋' }}
            renderItem={(item: any) => (
              <List.Item 
                className="hover:bg-gray-50 cursor-pointer p-4 rounded-lg transition-colors border-b-0 mb-2 bg-white border border-gray-100"
                onClick={() => selectAppointment(item)}
              >
                <List.Item.Meta
                  title={
                    <div className="flex justify-between items-center">
                      <Text strong>{item.name}</Text>
                      <Tag color={item.status === 'pending' ? 'blue' : (item.status === 'checked_in' ? 'green' : 'gray')}>
                        {item.status === 'pending' ? '待簽到' : (item.status === 'checked_in' ? '已入校' : '已離校')}
                      </Tag>
                    </div>
                  }
                  description={
                    <div className="text-xs text-gray-500 mt-1">
                      <p>電話: {item.phone}</p>
                      <p>時間: {dayjs(item.visit_time).format('YYYY/MM/DD HH:mm')}</p>
                      <p>事由: {item.reason}</p>
                    </div>
                  }
                />
              </List.Item>
            )}
            className="max-h-96 overflow-y-auto"
          />
        </Modal>
      </div>
    </div>
  );
};

export default GuardCheckin;
