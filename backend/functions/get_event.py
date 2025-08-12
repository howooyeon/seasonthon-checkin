import json
import boto3
from boto3.dynamodb.conditions import Key
import os
from cors_utils import lambda_cors_handler, create_response, create_error_response

dynamodb = boto3.resource('dynamodb')
events_table = dynamodb.Table(os.environ['EVENTS_TABLE'])
registrations_table = dynamodb.Table(os.environ['REGISTRATIONS_TABLE'])
checkins_table = dynamodb.Table(os.environ['CHECKINS_TABLE'])

@lambda_cors_handler
def lambda_handler(event, context):
    # URL 경로에서 event_code 추출
    event_code = event['pathParameters']['event_code']
    
    # 이벤트 정보 조회
    event_response = events_table.get_item(Key={'event_code': event_code})
    if 'Item' not in event_response:
        return create_error_response(404, '존재하지 않는 이벤트입니다')
    
    event_info = event_response['Item']
    
    # 등록자 수 조회
    registrations_response = registrations_table.query(
        KeyConditionExpression=Key('event_code').eq(event_code)
    )
    registrations = registrations_response['Items']
    registration_count = len(registrations)
    
    # 체크인 현황 조회
    checkins_response = checkins_table.scan(
        FilterExpression='event_code = :event_code',
        ExpressionAttributeValues={':event_code': event_code}
    )
    checkins = checkins_response['Items']
    checkin_count = len(checkins)
    
    # 체크인 리스트
    checkin_list = [
        {
            'name': checkin['name'],
            'phone': checkin['phone'],
            'checked_at': checkin['checked_at']
        } for checkin in checkins
    ]
    
    return create_response(200, {
        'event_info': {
            'event_code': event_info['event_code'],
            'event_name': event_info['event_name'],
            'event_date_time': event_info['event_date_time'],
            'description': event_info.get('description', ''),
            'qr_url': event_info.get('qr_url', '')
        },
        'statistics': {
            'total_registrations': registration_count,
            'total_checkins': checkin_count,
            'checkin_rate': f"{(checkin_count/registration_count*100):.1f}%" if registration_count > 0 else "0%"
        },
        'checkins': checkin_list
    })