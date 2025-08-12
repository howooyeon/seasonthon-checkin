import json
import boto3
from datetime import datetime
import os
from cors_utils import lambda_cors_handler, create_response, create_error_response

dynamodb = boto3.resource('dynamodb')
registrations_table = dynamodb.Table(os.environ['REGISTRATIONS_TABLE'])
checkins_table = dynamodb.Table(os.environ['CHECKINS_TABLE'])

@lambda_cors_handler
def lambda_handler(event, context):
    # 요청 본문 파싱
    body = json.loads(event['body'])
    phone = body['phone']
    event_code = body['event_code']
    
    # 등록된 참가자인지 확인
    registration_response = registrations_table.get_item(
        Key={
            'event_code': event_code,
            'phone': phone
        }
    )
    
    if 'Item' not in registration_response:
        return create_error_response(404, '등록되지 않은 참가자입니다.\n현장 스태프에게 문의해주세요.')
    
    registration = registration_response['Item']
    
    # 이미 체크인했는지 확인
    existing_checkin = checkins_table.get_item(
        Key={
            'phone': phone,
            'event_code': event_code
        }
    )
    
    if 'Item' in existing_checkin:
        return create_error_response(400, f'이미 체크인하셨습니다! 😊\n체크인 시간: {existing_checkin["Item"]["checked_at"]}')
    
    # 체크인 기록
    now = datetime.now().isoformat()
    checkins_table.put_item(
        Item={
            'event_code': event_code,
            'name': registration['name'],
            'phone': phone,
            'checked_at': now
        }
    )
    
    return create_response(200, {
        'message': '체크인 완료!',
        'name': registration['name'],
        'checked_at': now
    })