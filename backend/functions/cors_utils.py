import json

def get_cors_headers():
    """공통 CORS 헤더 반환"""
    return {
        'Access-Control-Allow-Origin': '*',
        'Access-Control-Allow-Headers': 'Content-Type,X-Amz-Date,Authorization,X-Api-Key,X-Amz-Security-Token',
        'Access-Control-Allow-Methods': 'GET,POST,OPTIONS',
        'Content-Type': 'application/json; charset=utf-8'
    }

def handle_options():
    """OPTIONS 요청 처리"""
    return {
        'statusCode': 200,
        'headers': get_cors_headers(),
        'body': ''
    }

def create_response(status_code, body, is_success=True):
    """표준 응답 생성"""
    return {
        'statusCode': status_code,
        'headers': get_cors_headers(),
        'body': json.dumps(body, ensure_ascii=False) if isinstance(body, dict) else body
    }

def create_error_response(status_code, error_message):
    """에러 응답 생성"""
    return create_response(status_code, {'error': error_message}, False)

def lambda_cors_handler(handler_func):
    """CORS 처리 데코레이터"""
    def wrapper(event, context):
        # OPTIONS 요청 처리
        if event.get('httpMethod') == 'OPTIONS':
            return handle_options()
        
        try:
            # 실제 핸들러 함수 실행
            return handler_func(event, context)
        except Exception as e:
            print(f"Error: {str(e)}")
            return create_error_response(500, f'서버 오류가 발생했습니다: {str(e)}')
    
    return wrapper