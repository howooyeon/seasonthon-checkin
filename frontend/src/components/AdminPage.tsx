import React, { useState } from 'react';
import api from '../services/api';

const config = {
  apiUrl: process.env.REACT_APP_API_URL
};

const API_BASE_URL = config.apiUrl;

const ADMIN_PASSWORD = process.env.REACT_APP_ADMIN_PASSWORD;

interface Participant {
  name: string;
  phone: string;
  univ?: string;
  part?: string;
}

const AdminPage: React.FC = () => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [password, setPassword] = useState('');
  const [eventName, setEventName] = useState('');
  const [eventDescription, setEventDescription] = useState('');
  const [eventCode, setEventCode] = useState('');
  const [csvFile, setCsvFile] = useState<File | null>(null);
  const [participants, setParticipants] = useState<Participant[]>([]);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [isSuccess, setIsSuccess] = useState(false);
  const [eventList, setEventList] = useState<any[]>([]);
  const [selectedEventForDownload, setSelectedEventForDownload] = useState('');

  // 로그인 처리
  const handleLogin = (e: React.FormEvent) => {
    e.preventDefault();
    if (password === ADMIN_PASSWORD) {
      setIsAuthenticated(true);
      setMessage('');
    } else {
      setMessage('비밀번호가 틀렸습니다.');
    }
  };

  // 로그아웃
  const handleLogout = () => {
    setIsAuthenticated(false);
    setPassword('');
  };

  // 로그인 화면
  if (!isAuthenticated) {
    return (
      <div style={{
        minHeight: '100vh',
        backgroundColor: '#ffffff',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '20px',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
      }}>
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '32px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e2e8f0',
          width: '100%',
          maxWidth: '400px'
        }}>
          <h1 style={{
            fontSize: '24px',
            fontWeight: 'bold',
            color: '#2d3748',
            marginBottom: '24px',
            textAlign: 'center'
          }}>
            관리자 로그인
          </h1>

          <div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#4a5568',
                marginBottom: '8px'
              }}>
                비밀번호
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '16px',
                  boxSizing: 'border-box'
                }}
                placeholder="관리자 비밀번호를 입력하세요"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleLogin(e);
                  }
                }}
              />
            </div>

            <button
              onClick={handleLogin}
              style={{
                width: '100%',
                backgroundColor: '#667eea',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '16px',
                fontWeight: '600',
                cursor: 'pointer'
              }}
            >
              로그인
            </button>
          </div>

          {message && (
            <div style={{
              marginTop: '16px',
              padding: '12px',
              borderRadius: '8px',
              backgroundColor: '#fed7d7',
              color: '#c53030',
              textAlign: 'center',
              fontSize: '14px'
            }}>
              {message}
            </div>
          )}

          <div style={{
            marginTop: '16px',
            padding: '12px',
            backgroundColor: '#f7fafc',
            borderRadius: '8px',
            fontSize: '12px',
            color: '#718096',
            textAlign: 'center'
          }}>
            관리자만 접근 가능합니다
          </div>
        </div>
      </div>
    );
  }

  // 이벤트 생성
  const handleCreateEvent = async () => {
    if (!eventName.trim()) {
      setMessage('이벤트 이름을 입력해주세요.');
      setIsSuccess(false);
      return;
    }

    setLoading(true);
    setMessage('');

    try {
      const result = await api.createEvent({
        event_name: eventName,
        description: eventDescription
      });
      
      setEventCode(result.event_code);
      setMessage(`이벤트가 생성되었습니다!\n이벤트 코드: ${result.event_code}`);
      setIsSuccess(true);

    } catch (error) {
      setMessage('이벤트 생성 중 오류가 발생했습니다.');
      setIsSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  // CSV 라인 파싱 함수 (따옴표 처리)
  const parseCSVLine = (line: string): string[] => {
    const result: string[] = [];
    let current = '';
    let inQuotes = false;
    
    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];
      
      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"';
          i++;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    
    result.push(current.trim());
    return result;
  };

  // 헤더 인덱스 찾기
  const findHeaderIndex = (headers: string[], searchTerms: string[]): number => {
    for (const term of searchTerms) {
      const index = headers.findIndex(h => h.includes(term));
      if (index !== -1) return index;
    }
    return -1;
  };

  // 값 가져오기
  const getValue = (values: string[], index: number, defaultIndex?: number): string => {
    if (index !== -1 && index < values.length) {
      return values[index]?.trim() || '';
    }
    if (defaultIndex !== undefined && defaultIndex < values.length) {
      return values[defaultIndex]?.trim() || '';
    }
    return '';
  };

  // 개선된 CSV 파일 업로드 처리
  const handleFileUpload = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setCsvFile(file);
    const reader = new FileReader();
    
    reader.onload = (event) => {
      try {
        const csv = event.target?.result as string;
        
        // BOM 제거
        const cleanCsv = csv.replace(/^\uFEFF/, '');
        
        // 라인 분리
        const lines = cleanCsv.split(/\r\n|\n|\r/).filter(line => line.trim());
        
        if (lines.length < 2) {
          setMessage('CSV 파일에 데이터가 부족합니다.');
          setIsSuccess(false);
          return;
        }

        // 헤더 파싱
        const headers = parseCSVLine(lines[0]).map(h => h.trim().toLowerCase());
        console.log('Headers:', headers);
        
        const parsedParticipants: Participant[] = [];
        
        for (let i = 1; i < lines.length; i++) {
          const values = parseCSVLine(lines[i]);
          
          if (values.length >= 2 && values[0]?.trim() && values[1]?.trim()) {
            const nameIndex = findHeaderIndex(headers, ['name', '이름', '성함', '성명']);
            const univIndex = findHeaderIndex(headers, ['univ', 'school', '학교', '소속학교', '대학교', '소속']);
            const phoneIndex = findHeaderIndex(headers, ['phone', '전화', '핸드폰', '전화번호', 'tel']);
            const partIndex = findHeaderIndex(headers, ['part', '파트', '본인파트', '역할']);
            
            const participant: Participant = {
              name: getValue(values, nameIndex, 0),
              univ: getValue(values, univIndex, 1),
              phone: getValue(values, phoneIndex, 2),
              part: getValue(values, partIndex, 3)
            };

            if (participant.name && participant.phone) {
              parsedParticipants.push(participant);
            }
          }
        }
        
        setParticipants(parsedParticipants);
        setMessage(`${parsedParticipants.length}명의 참가자가 파싱되었습니다.`);
        setIsSuccess(true);
        
      } catch (error) {
        console.error('CSV 파싱 에러:', error);
        setMessage('CSV 파일을 읽는 중 오류가 발생했습니다. 파일 형식을 확인해주세요.');
        setIsSuccess(false);
      }
    };
    
    reader.readAsText(file, 'UTF-8');
  };

  // 전화번호 정규화
  const normalizePhone = (phone: string): string => {
    return phone.replace(/[-\s]/g, '');
  };

  // 이벤트 참가자 목록 로드 (CORS 우회 포함)
  const loadEventParticipants = async (eventCode: string) => {
    if (!eventCode) return;
    
    try {
      setLoading(true);
      setMessage('참가자 목록을 불러오는 중...');
      
      const response = await fetch(`${API_BASE_URL}/events/${eventCode}/participants`, {
        method: 'GET',
        headers: {
          'Content-Type': 'application/json',
        },
      });
      
      if (response.ok) {
        const data = await response.json();
        setParticipants(data.participants || []);
        setMessage(`${data.participants?.length || 0}명의 등록된 참가자를 불러왔습니다.`);
        setIsSuccess(true);
      } else if (response.status === 404) {
        setMessage('해당 API가 구현되지 않았습니다. 업로드된 참가자 목록을 사용합니다.');
        setIsSuccess(false);
      } else {
        setMessage('참가자 목록을 불러올 수 없습니다. 이벤트 코드를 확인해주세요.');
        setIsSuccess(false);
      }
    } catch (error) {
      console.error('참가자 목록 로드 실패:', error);
      
      // CORS 에러 감지
      if (error instanceof TypeError && error.message.includes('fetch')) {
        // 대안: 현재 업로드된 참가자 목록이 있다면 그것을 사용
        if (participants.length > 0) {
          setMessage(`CORS 에러로 서버 데이터를 불러올 수 없습니다.\n현재 업로드된 ${participants.length}명의 참가자 목록을 사용합니다.`);
          setIsSuccess(true);
        } else {
          setMessage('CORS 에러: 백엔드 CORS 설정이 필요합니다.\n먼저 CSV 파일을 업로드해주세요.');
          setIsSuccess(false);
        }
      } else {
        setMessage('참가자 목록 로드 중 오류가 발생했습니다.');
        setIsSuccess(false);
      }
    } finally {
      setLoading(false);
    }
  };

  // 개선된 CSV 다운로드 기능 (API 실패 대응)
  const handleDownloadCSV = async () => {
    if (!selectedEventForDownload) {
      setMessage('다운로드할 이벤트를 선택해주세요.');
      return;
    }

    if (participants.length === 0) {
      setMessage('참가자 목록이 없습니다. 먼저 CSV 파일을 업로드해주세요.');
      setIsSuccess(false);
      return;
    }

    try {
      setLoading(true);
      setMessage('체크인 현황을 조회하는 중...');
      
      let eventData = null;
      let checkins: any[] = [];

      // 이벤트 정보와 체크인 현황 조회 시도
      try {
        const eventResponse = await fetch(`${API_BASE_URL}/events/${selectedEventForDownload}`, {
          method: 'GET',
          headers: {
            'Content-Type': 'application/json',
          },
        });
        
        if (eventResponse.ok) {
          eventData = await eventResponse.json();
          checkins = eventData.checkins || [];
          console.log('체크인 데이터를 가져왔습니다:', checkins.length);
        } else {
          console.log('이벤트 API 응답 실패:', eventResponse.status);
        }
      } catch (eventError) {
        console.log('이벤트 API 호출 실패:', eventError);
      }

      // 체크인 데이터가 없으면 참가자만으로 CSV 생성
      if (checkins.length === 0) {
        setMessage('체크인 데이터를 가져올 수 없어 참가자 목록만으로 CSV를 생성합니다.');
        
        const csvData = participants.map((participant: Participant) => ({
          name: participant.name || '',
          univ: participant.univ || '',
          phone: participant.phone || '',
          part: participant.part || '',
          checked_in: 'X',
          checked_at: ''
        }));

        await downloadCSVFile(csvData, selectedEventForDownload);
        return;
      }

      // 전화번호 정규화
      const checkedInPhones = new Set(
        checkins.map((c: any) => normalizePhone(c.phone))
      );
      
      // CSV 데이터 생성
      const csvData = participants.map((participant: Participant) => {
        const normalizedPhone = normalizePhone(participant.phone);
        const isCheckedIn = checkedInPhones.has(normalizedPhone);
        const checkinInfo = checkins.find((c: any) => 
          normalizePhone(c.phone) === normalizedPhone
        );
        
        return {
          name: participant.name || '',
          univ: participant.univ || '',
          phone: participant.phone || '',
          part: participant.part || '',
          checked_in: isCheckedIn ? 'O' : 'X',
          checked_at: checkinInfo?.checked_at || ''
        };
      });

      // 체크인했지만 등록되지 않은 사람들도 추가
      const registeredPhones = new Set(
        participants.map((p: Participant) => normalizePhone(p.phone))
      );
      
      checkins.forEach((checkin: any) => {
        const normalizedPhone = normalizePhone(checkin.phone);
        if (!registeredPhones.has(normalizedPhone)) {
          csvData.push({
            name: checkin.name || '미등록',
            univ: '미등록',
            phone: checkin.phone,
            part: '미등록',
            checked_in: 'O',
            checked_at: checkin.checked_at
          });
        }
      });

      await downloadCSVFile(csvData, selectedEventForDownload);

    } catch (error) {
      console.error('CSV 다운로드 에러:', error);
      setMessage('CSV 다운로드 중 오류가 발생했습니다.\nCORS 에러인 경우 백엔드 설정이 필요합니다.');
      setIsSuccess(false);
    } finally {
      setLoading(false);
    }
  };

  // CSV 파일 다운로드 함수 분리
  const downloadCSVFile = async (csvData: any[], eventCode: string) => {
    try {
      // 한국 시간으로 변환하는 함수
      const formatKoreanDateTime = (isoString: string): string => {
        if (!isoString) return '';
        
        const date = new Date(isoString);
        const koreanDate = new Date(date.getTime() + (9 * 60 * 60 * 1000)); // UTC + 9시간
        
        const year = koreanDate.getFullYear();
        const month = String(koreanDate.getMonth() + 1).padStart(2, '0');
        const day = String(koreanDate.getDate()).padStart(2, '0');
        const hours = String(koreanDate.getHours()).padStart(2, '0');
        const minutes = String(koreanDate.getMinutes()).padStart(2, '0');
        
        return `${year}-${month}-${day} ${hours}:${minutes}`;
      };

      // CSV 생성 (Excel 호환)
      const csvHeaders = ['성함', '소속학교', '전화번호', '본인파트', '체크인여부', '체크인시간'];
      const csvContent = [
        csvHeaders,
        ...csvData.map((row: any) => [
          row.name || '',
          row.univ || '',
          row.phone || '',
          row.part || '',
          row.checked_in || 'X',
          formatKoreanDateTime(row.checked_at)
        ])
      ].map((row: (string | number)[]) => 
        row.map((cell: string | number) => `"${String(cell).replace(/"/g, '""')}"`)
      ).map((row: string[]) => row.join(',')).join('\n');

      // BOM 추가로 Excel에서 한글 깨짐 방지
      const bomCsvContent = '\uFEFF' + csvContent;
      
      // 파일 다운로드
      const blob = new Blob([bomCsvContent], { 
        type: 'text/csv;charset=utf-8;' 
      });
      const link = document.createElement('a');
      const url = URL.createObjectURL(blob);
      link.setAttribute('href', url);
      link.setAttribute('download', `체크인현황_${eventCode}_${new Date().toISOString().split('T')[0]}.csv`);
      link.style.visibility = 'hidden';
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      const checkedInCount = csvData.filter((p: any) => p.checked_in === 'O').length;
      setMessage(`체크인 현황 CSV 파일이 다운로드되었습니다.\n총 ${csvData.length}명 (체크인: ${checkedInCount}명)`);
      setIsSuccess(true);
    } catch (error) {
      console.error('파일 다운로드 에러:', error);
      setMessage('파일 다운로드 중 오류가 발생했습니다.');
      setIsSuccess(false);
    }
  };

  // 일괄 등록
  const handleBulkRegister = async () => {
    if (!eventCode || participants.length === 0) {
      setMessage('이벤트 코드와 참가자 목록이 필요합니다.');
      return;
    }

    setLoading(true);
    setMessage('');
    
    let successCount = 0;
    let errorCount = 0;
    
    for (const participant of participants) {
      try {
        const response = await fetch(`${API_BASE_URL}/events/${eventCode}/register`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(participant)
        });
        
        if (response.ok) {
          successCount++;
        } else {
          errorCount++;
        }
        
        // API 호출 간격
        await new Promise(resolve => setTimeout(resolve, 100));
        
      } catch (error) {
        errorCount++;
      }
    }
    
    setMessage(`등록 완료!\n성공: ${successCount}명\n실패: ${errorCount}명`);
    setIsSuccess(errorCount === 0);
    setLoading(false);
  };

  // 관리자 메인 화면
  return (
    <div style={{
      minHeight: '100vh',
      backgroundColor: '#ffffff',
      padding: '20px',
      fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif'
    }}>
      <div style={{ maxWidth: '800px', margin: '0 auto' }}>
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          alignItems: 'center', 
          marginBottom: '32px' 
        }}>
          <h1 style={{
            fontSize: '32px',
            fontWeight: 'bold',
            color: '#2d3748',
            margin: '0'
          }}>
            관리자 페이지
          </h1>
          <button
            onClick={handleLogout}
            style={{
              backgroundColor: '#0485EA',
              color: 'white',
              padding: '8px 16px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '14px',
              cursor: 'pointer'
            }}
          >
            로그아웃
          </button>
        </div>

        {/* 이벤트 생성 */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e2e8f0'
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '600',
            color: '#2d3748',
            marginBottom: '16px'
          }}>
            1. 이벤트 생성
          </h2>
          
          <div>
            <div style={{ marginBottom: '16px' }}>
              <label style={{
                display: 'block',
                fontSize: '14px',
                fontWeight: '500',
                color: '#4a5568',
                marginBottom: '8px'
              }}>
                이벤트 이름
              </label>
              <input
                type="text"
                value={eventName}
                onChange={(e) => setEventName(e.target.value)}
                style={{
                  width: '100%',
                  padding: '12px 16px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '16px',
                  boxSizing: 'border-box'
                }}
                placeholder="예: 2025 시즌톤 예선전"
              />
            </div>

            <button
              onClick={handleCreateEvent}
              disabled={loading || !eventName}
              style={{
                backgroundColor: loading || !eventName ? '#a0aec0' : '#667eea',
                color: 'white',
                padding: '12px 24px',
                borderRadius: '8px',
                border: 'none',
                fontSize: '16px',
                fontWeight: '600',
                cursor: loading || !eventName ? 'not-allowed' : 'pointer'
              }}
            >
              {loading ? '생성 중...' : '이벤트 생성'}
            </button>
          </div>

          {eventCode && (
            <div style={{
              marginTop: '16px',
              padding: '16px',
              backgroundColor: '#f0fff4',
              border: '1px solid #9ae6b4',
              borderRadius: '8px'
            }}>
              <p style={{ margin: '0', fontWeight: '600' }}>
                이벤트 코드: <span style={{ color: '#667eea' }}>{eventCode}</span>
              </p>
              <p style={{ margin: '8px 0 0 0', fontSize: '14px', color: '#4a5568' }}>
                이벤트 링크: {window.location.origin}/checkin/{eventCode}
              </p>
            </div>
          )}
        </div>

        {/* CSV 업로드 */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e2e8f0'
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '600',
            color: '#2d3748',
            marginBottom: '16px'
          }}>
            2. 참가자 CSV 업로드
          </h2>

          <div style={{
            marginBottom: '16px',
            padding: '16px',
            backgroundColor: '#f7fafc',
            borderRadius: '8px',
            fontSize: '14px',
            color: '#4a5568'
          }}>
            <p style={{ margin: '0 0 8px 0', fontWeight: '600' }}>CSV 파일 형식</p>
            <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#718096' }}>
              • 헤더명: 성함, 소속학교, 전화번호, 본인파트<br />
              • 따옴표로 감싸진 데이터도 자동 처리됩니다
            </p>
          </div>

          <input
            type="file"
            accept=".csv"
            onChange={handleFileUpload}
            style={{
              width: '100%',
              padding: '12px',
              border: '2px dashed #e2e8f0',
              borderRadius: '8px',
              marginBottom: '16px'
            }}
          />

          {participants.length > 0 && (
            <div style={{
              marginBottom: '16px',
              maxHeight: '200px',
              overflowY: 'auto',
              border: '1px solid #e2e8f0',
              borderRadius: '8px',
              padding: '12px'
            }}>
              <h3 style={{ margin: '0 0 12px 0' }}>참가자 목록 ({participants.length}명)</h3>
              {participants.slice(0, 10).map((p, index) => (
                <div key={index} style={{ marginBottom: '4px', fontSize: '14px' }}>
                  {p.name} - {p.univ || '미지정'} - {p.phone} - {p.part || '미지정'}
                </div>
              ))}
              {participants.length > 10 && (
                <div style={{ fontSize: '14px', color: '#718096' }}>
                  ... 외 {participants.length - 10}명
                </div>
              )}
            </div>
          )}

          <button
            onClick={handleBulkRegister}
            disabled={loading || !eventCode || participants.length === 0}
            style={{
              backgroundColor: loading || !eventCode || participants.length === 0 ? '#a0aec0' : '#48bb78',
              color: 'white',
              padding: '12px 24px',
              borderRadius: '8px',
              border: 'none',
              fontSize: '16px',
              fontWeight: '600',
              cursor: loading || !eventCode || participants.length === 0 ? 'not-allowed' : 'pointer'
            }}
          >
            {loading ? '등록 중...' : '참가자 일괄 등록'}
          </button>
        </div>

        {/* CSV 다운로드 섹션 */}
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          padding: '24px',
          marginBottom: '24px',
          boxShadow: '0 4px 6px rgba(0, 0, 0, 0.1)',
          border: '1px solid #e2e8f0'
        }}>
          <h2 style={{
            fontSize: '20px',
            fontWeight: '600',
            color: '#2d3748',
            marginBottom: '16px'
          }}>
            3. 체크인 현황 다운로드
          </h2>

          <div style={{ marginBottom: '16px' }}>
            <label style={{
              display: 'block',
              fontSize: '14px',
              fontWeight: '500',
              color: '#4a5568',
              marginBottom: '8px'
            }}>
              이벤트 코드
            </label>
            <div style={{ display: 'flex', gap: '12px', marginBottom: '12px', flexWrap: 'wrap', alignItems: 'center' }}>
              <input
                type="text"
                value={selectedEventForDownload}
                onChange={(e) => setSelectedEventForDownload(e.target.value)}
                style={{
                  flex: '1',
                  minWidth: '200px',
                  padding: '12px 16px',
                  border: '1px solid #e2e8f0',
                  borderRadius: '8px',
                  fontSize: '16px'
                }}
                placeholder="예: ABC123"
              />
              <button
                onClick={() => loadEventParticipants(selectedEventForDownload)}
                disabled={loading || !selectedEventForDownload}
                style={{
                  backgroundColor: loading || !selectedEventForDownload ? '#a0aec0' : '#4299e1',
                  color: 'white',
                  padding: '12px 16px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '14px',
                  cursor: loading || !selectedEventForDownload ? 'not-allowed' : 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {loading ? '로딩...' : '참가자 로드'}
              </button>
              <button
                onClick={handleDownloadCSV}
                disabled={loading || !selectedEventForDownload}
                style={{
                  backgroundColor: loading || !selectedEventForDownload ? '#a0aec0' : '#805ad5',
                  color: 'white',
                  padding: '12px 24px',
                  borderRadius: '8px',
                  border: 'none',
                  fontSize: '16px',
                  fontWeight: '600',
                  cursor: loading || !selectedEventForDownload ? 'not-allowed' : 'pointer',
                  whiteSpace: 'nowrap'
                }}
              >
                {loading ? '다운로드 중...' : 'CSV 다운로드'}
              </button>
            </div>
          </div>

          <div style={{
            padding: '16px',
            backgroundColor: '#fff3cd',
            border: '1px solid #ffeaa7',
            borderRadius: '8px',
            fontSize: '14px',
            color: '#856404',
            marginBottom: '16px'
          }}>
            <p style={{ margin: '0 0 8px 0', fontWeight: '600' }}>📋 다운로드 파일 포함 내용</p>
            <p style={{ margin: '0' }}>• 성함, 소속학교, 전화번호, 본인파트, 체크인여부, 체크인시간</p>
            <p style={{ margin: '0' }}>• 체크인 시간은 한국 시간(KST)으로 표시됩니다</p>
            <p style={{ margin: '8px 0 0 0', fontSize: '12px', color: '#856404' }}>
              전화번호 형식이 달라도 자동으로 매칭됩니다 (하이픈 있음/없음)
            </p>
          </div>
        </div>

        {/* 메시지 */}
        {message && (
          <div style={{
            padding: '16px',
            borderRadius: '8px',
            backgroundColor: isSuccess ? '#f0fff4' : '#fed7d7',
            color: isSuccess ? '#2f855a' : '#c53030',
            border: `1px solid ${isSuccess ? '#9ae6b4' : '#feb2b2'}`,
            whiteSpace: 'pre-line',
            textAlign: 'center'
          }}>
            {message}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminPage;