import json
import boto3
from datetime import datetime
import os
from cors_utils import lambda_cors_handler, create_response, create_error_response

dynamodb = boto3.resource('dynamodb')

@lambda_cors_handler
def lambda_handler(event, context):
    # 환경 변수에서 테이블 이름 가져오기
    events_table_name = os.environ.get('EVENTS_TABLE')
    registrations_table_name = os.environ.get('REGISTRATIONS_TABLE')
    
    if not events_table_name or not registrations_table_name:
        return create_error_response(500, '환경 변수가 설정되지 않았습니다')
    
    events_table = dynamodb.Table(events_table_name)
    registrations_table = dynamodb.Table(registrations_table_name)
    
    # URL 경로에서 event_code 추출
    event_code = event['pathParameters']['event_code']
    
    # 요청 본문 파싱
    body = json.loads(event['body'])
    
    # 이벤트가 존재하는지 확인
    event_response = events_table.get_item(Key={'event_code': event_code})
    if 'Item' not in event_response:
        return create_error_response(404, '존재하지 않는 이벤트입니다')
    
    # 이미 등록된 사용자인지 확인
    existing_registration = registrations_table.get_item(
        Key={
            'event_code': event_code,
            'phone': body['phone']
        }
    )
    
    if 'Item' in existing_registration:
        return create_error_response(400, '이미 등록된 전화번호입니다')
    
    # 참가자 등록
    registrations_table.put_item(
        Item={
            'event_code': event_code,
            'phone': body['phone'],
            'name': body['name'],
            'univ': body.get('univ', ''),
            'part': body.get('part', ''),
            'registered_at': datetime.now().isoformat()
        }
    )
    
    return create_response(201, {
        'message': '등록이 완료되었습니다',
        'event_code': event_code,
        'name': body['name']
    })