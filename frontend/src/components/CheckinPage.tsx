import React, { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';

const config = {
  apiUrl: process.env.REACT_APP_API_URL
};

const API_BASE_URL = config.apiUrl;

interface EventInfo {
  event_code: string;
  event_name: string;
  event_date_time: string;
  description: string;
}

const CheckinPage: React.FC = () => {
  const { eventCode } = useParams<{ eventCode: string }>();
  const [eventInfo, setEventInfo] = useState<EventInfo | null>(null);
  const [name, setName] = useState('');
  const [phone, setPhone] = useState('');
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);

  useEffect(() => {
    const fetchEventInfo = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/events/${eventCode}`);
        if (!response.ok) {
          throw new Error(`HTTP error! status: ${response.status}`);
        }
        const data = await response.json();
        setEventInfo(data.event_info);
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
        setMessage(`이벤트를 찾을 수 없습니다: ${errorMessage}`);
      }
    };

    if (eventCode) {
      fetchEventInfo();
    }
  }, [eventCode]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setMessage('');

    try {
      const checkinResponse = await fetch(`${API_BASE_URL}/checkin`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          phone: phone,
          event_code: eventCode
        })
      });

      if (!checkinResponse.ok) {
        const errorData = await checkinResponse.json();
        
        if (errorData.error?.includes('등록되지 않은')) {
          setMessage('등록되지 않은 참가자입니다.\n현장 스태프에게 문의해주세요.');
        } else if (errorData.error?.includes('이미 체크인')) {
          setMessage('이미 체크인하셨습니다! 😊');
        } else {
          setMessage(errorData.error || '체크인 중 오류가 발생했습니다');
        }
        setIsSuccess(false);
        return;
      }

      setMessage(`${name}님, 체크인이 완료되었습니다! 🎉`);
      setIsSuccess(true);

    } catch (error: any) {
      const errorMessage = error instanceof Error ? error.message : '알 수 없는 오류';
      setMessage(`체크인 중 오류가 발생했습니다: ${errorMessage}`);
      setIsSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  if (!eventInfo) {
    return (
      <div style={{ 
        minHeight: '100vh',
        backgroundColor: '#ffffff',
        display: 'flex', 
        alignItems: 'center', 
        justifyContent: 'center',
        padding: '20px'
      }}>
        <div style={{ 
          backgroundColor: 'white',
          borderRadius: '24px',
          padding: '48px',
          textAlign: 'center',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e2e8f0'
        }}>
          <div style={{ 
            width: '64px', 
            height: '64px', 
            border: '4px solid #e5e7eb', 
            borderTop: '4px solid #667eea',
            borderRadius: '50%',
            animation: 'spin 1s linear infinite',
            margin: '0 auto 24px'
          }}></div>
          <p style={{ 
            color: '#4a5568',
            fontSize: '18px',
            fontWeight: '500',
            margin: '0'
          }}>
            이벤트 정보를 불러오는 중...
          </p>
          {message && (
            <p style={{ 
              color: '#e53e3e', 
              marginTop: '16px',
              fontSize: '16px',
              padding: '12px',
              backgroundColor: 'rgba(254, 226, 226, 0.8)',
              borderRadius: '12px'
            }}>
              {message}
            </p>
          )}
        </div>
      </div>
    );
  }

  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#ffffff',
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{ maxWidth: '480px', margin: '0 auto' }}>
        {/* 이벤트 정보 카드 */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '24px',
          padding: '32px',
          marginBottom: '24px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e2e8f0',
          position: 'relative',
          overflow: 'hidden'
        }}>
          <div style={{ position: 'relative', zIndex: 1 }}>
            <h1 style={{ 
              fontSize: '28px', 
              fontWeight: 'bold', 
              color: '#2d3748', 
              marginBottom: '16px',
              lineHeight: '1.2'
            }}>
              {eventInfo.event_name}
            </h1>
            
            <div style={{ marginBottom: '12px' }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                color: '#667eea',
                fontSize: '16px',
                fontWeight: '500'
              }}>
                {new Date(eventInfo.event_date_time).toLocaleString('ko-KR')}
              </span>
            </div>
            
            <div style={{ marginBottom: '16px' }}>
              <span style={{
                display: 'inline-flex',
                alignItems: 'center',
                color: '#667eea',
                fontSize: '16px',
                fontWeight: '500'
              }}>
                이벤트 코드: {eventInfo.event_code}
              </span>
            </div>
          </div>
        </div>

        {/* 체크인 폼 */}
        {!isSuccess ? (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '24px',
            padding: '32px',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e2e8f0'
          }}>
            <form onSubmit={handleSubmit}>
              <div style={{ marginBottom: '20px' }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '16px', 
                  fontWeight: '600', 
                  color: '#4a5568', 
                  marginBottom: '8px' 
                }}>
                  이름
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '16px 20px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '16px',
                    fontSize: '16px',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                    backgroundColor: '#f8fafc',
                    boxSizing: 'border-box'
                  }}
                  placeholder="이름을 입력하세요"
                  required
                  onFocus={(e) => {
                    e.target.style.borderColor = '#667eea';
                    e.target.style.backgroundColor = '#ffffff';
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 10px 20px rgba(102, 126, 234, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e2e8f0';
                    e.target.style.backgroundColor = '#f8fafc';
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              <div style={{ marginBottom: '32px' }}>
                <label style={{ 
                  display: 'block', 
                  fontSize: '16px', 
                  fontWeight: '600', 
                  color: '#4a5568', 
                  marginBottom: '8px' 
                }}>
                  전화번호
                </label>
                <input
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  style={{
                    width: '100%',
                    padding: '16px 20px',
                    border: '2px solid #e2e8f0',
                    borderRadius: '16px',
                    fontSize: '16px',
                    outline: 'none',
                    transition: 'all 0.3s ease',
                    backgroundColor: '#f8fafc',
                    boxSizing: 'border-box'
                  }}
                  placeholder="01012345678"
                  required
                  onFocus={(e) => {
                    e.target.style.borderColor = '#667eea';
                    e.target.style.backgroundColor = '#ffffff';
                    e.target.style.transform = 'translateY(-2px)';
                    e.target.style.boxShadow = '0 10px 20px rgba(102, 126, 234, 0.1)';
                  }}
                  onBlur={(e) => {
                    e.target.style.borderColor = '#e2e8f0';
                    e.target.style.backgroundColor = '#f8fafc';
                    e.target.style.transform = 'translateY(0)';
                    e.target.style.boxShadow = 'none';
                  }}
                />
              </div>

              <button
                type="submit"
                disabled={loading || !name || !phone}
                style={{
                  width: '100%',
                  background: loading || !name || !phone ? 
                    'linear-gradient(135deg, #a0aec0 0%, #718096 100%)' : 
                    'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  color: 'white',
                  padding: '18px 24px',
                  borderRadius: '16px',
                  border: 'none',
                  fontSize: '18px',
                  fontWeight: '700',
                  cursor: loading || !name || !phone ? 'not-allowed' : 'pointer',
                  transition: 'all 0.3s ease',
                  boxShadow: loading || !name || !phone ? 'none' : '0 10px 20px rgba(102, 126, 234, 0.3)',
                  transform: loading ? 'scale(0.98)' : 'scale(1)'
                }}
                onMouseEnter={(e) => {
                  if (!loading && name && phone) {
                    e.currentTarget.style.transform = 'translateY(-2px) scale(1.02)';
                    e.currentTarget.style.boxShadow = '0 15px 30px rgba(102, 126, 234, 0.4)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!loading && name && phone) {
                    e.currentTarget.style.transform = 'translateY(0) scale(1)';
                    e.currentTarget.style.boxShadow = '0 10px 20px rgba(102, 126, 234, 0.3)';
                  }
                }}
              >
                {loading ? (
                  <span style={{ display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <div style={{
                      width: '20px',
                      height: '20px',
                      border: '2px solid transparent',
                      borderTop: '2px solid white',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                      marginRight: '12px'
                    }}></div>
                    체크인 중...
                  </span>
                ) : '체크인하기'}
              </button>
            </form>

            <div style={{ 
              marginTop: '24px', 
              fontSize: '14px', 
              color: '#718096',
              textAlign: 'center',
              padding: '16px',
              backgroundColor: 'rgba(102, 126, 234, 0.05)',
              borderRadius: '12px'
            }}>
              <p style={{ margin: '0 0 8px 0' }}>사전에 등록된 참가자만 체크인할 수 있습니다.</p>
              <p style={{ margin: '0' }}>등록되지 않은 경우 현장 스태프에게 문의해주세요.</p>
            </div>

            {message && (
              <div style={{
                marginTop: '20px',
                padding: '16px 20px',
                borderRadius: '16px',
                backgroundColor: isSuccess ? 'rgba(72, 187, 120, 0.1)' : 'rgba(245, 101, 101, 0.1)',
                color: isSuccess ? '#2f855a' : '#c53030',
                border: `2px solid ${isSuccess ? 'rgba(72, 187, 120, 0.2)' : 'rgba(245, 101, 101, 0.2)'}`,
                fontSize: '16px',
                fontWeight: '500',
                textAlign: 'center',
                whiteSpace: 'pre-line'
              }}>
                {message}
              </div>
            )}
          </div>
        ) : (
          <div style={{
            backgroundColor: 'white',
            borderRadius: '24px',
            padding: '48px 32px',
            textAlign: 'center',
            boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
            border: '1px solid #e2e8f0',
            position: 'relative',
            overflow: 'hidden'
          }}>
            {/* 성공 애니메이션 배경 */}
            <div style={{
              position: 'absolute',
              top: '50%',
              left: '50%',
              width: '200px',
              height: '200px',
              background: 'radial-gradient(circle, rgba(72, 187, 120, 0.1) 0%, transparent 70%)',
              borderRadius: '50%',
              transform: 'translate(-50%, -50%)',
              animation: 'pulse 2s infinite'
            }}></div>
            
            <div style={{ position: 'relative', zIndex: 1 }}>
              <div style={{ 
                fontSize: '50px', 
                marginBottom: '24px',
                animation: 'bounce 1s ease-in-out'
              }}>
                ✓
              </div>
              
              <h2 style={{ 
                fontSize: '32px', 
                fontWeight: 'bold', 
                color: '#2f855a', 
                marginBottom: '16px'
              }}>
                체크인 완료!
              </h2>
              
              <p style={{ 
                color: '#4a5568', 
                marginBottom: '24px',
                fontSize: '18px',
                lineHeight: '1.6'
              }}>
                <strong>{name}</strong>님,<br />
                <strong>{eventInfo.event_name}</strong>에<br />
                참여해주셔서 감사합니다!
              </p>
              
              <div style={{
                backgroundColor: 'rgba(72, 187, 120, 0.1)',
                padding: '20px',
                borderRadius: '16px',
                border: '2px solid rgba(72, 187, 120, 0.2)'
              }}>
                <p style={{ 
                  fontSize: '16px', 
                  color: '#2f855a',
                  margin: '0',
                  fontWeight: '600'
                }}>
                  체크인 시간: {new Date().toLocaleString('ko-KR')}
                </p>
              </div>
            </div>
          </div>
        )}
      </div>

      <style>
        {`
          @keyframes spin {
            0% { transform: rotate(0deg); }
            100% { transform: rotate(360deg); }
          }
          
          @keyframes bounce {
            0%, 20%, 53%, 80%, 100% {
              transform: translate3d(0,0,0);
            }
            40%, 43% {
              transform: translate3d(0,-20px,0);
            }
            70% {
              transform: translate3d(0,-10px,0);
            }
            90% {
              transform: translate3d(0,-4px,0);
            }
          }
          
          @keyframes pulse {
            0% {
              transform: translate(-50%, -50%) scale(1);
              opacity: 1;
            }
            50% {
              transform: translate(-50%, -50%) scale(1.1);
              opacity: 0.7;
            }
            100% {
              transform: translate(-50%, -50%) scale(1);
              opacity: 1;
            }
          }
        `}
      </style>
    </div>
  );
};

export default CheckinPage;