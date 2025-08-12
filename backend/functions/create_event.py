import json
import boto3
import uuid
from datetime import datetime, timedelta
import os
from cors_utils import lambda_cors_handler, create_response, create_error_response

dynamodb = boto3.resource('dynamodb')
events_table = dynamodb.Table(os.environ['EVENTS_TABLE'])

@lambda_cors_handler
def lambda_handler(event, context):
    body = json.loads(event['body'])
    
    event_code = str(uuid.uuid4())[:8].upper()
    
    now = datetime.now()
    
    frontend_url = os.environ.get('FRONTEND_URL')
    if not frontend_url:
        return create_error_response(500, '프론트엔드 URL이 설정되지 않았습니다')
    
    checkin_url = f'{frontend_url}/checkin/{event_code}'
    
    # DynamoDB에 이벤트 저장
    events_table.put_item(
        Item={
            'event_code': event_code,
            'event_name': body['event_name'],
            'event_date_time': body.get('event_date_time', now.isoformat()),
            'description': body.get('description', ''),
            'created_at': now.isoformat(),
            'code_expired_at': (now + timedelta(hours=24)).isoformat(),
            'qr_url': f'https://api.qrserver.com/v1/create-qr-code/?data={checkin_url}&size=200x200'
        }
    )
    
    return create_response(201, {
        'message': '이벤트가 생성되었습니다',
        'event_code': event_code,
        'qr_url': f'https://api.qrserver.com/v1/create-qr-code/?data={checkin_url}&size=200x200',
        'checkin_url': checkin_url
    })