import json
import boto3
from boto3.dynamodb.conditions import Key
import os
from cors_utils import lambda_cors_handler, create_response

dynamodb = boto3.resource('dynamodb')
registrations_table = dynamodb.Table(os.environ['REGISTRATIONS_TABLE'])

@lambda_cors_handler
def lambda_handler(event, context):
    # URL 경로에서 event_code 추출
    event_code = event['pathParameters']['event_code']
    
    # 등록된 참가자 목록 조회
    registrations_response = registrations_table.query(
        KeyConditionExpression=Key('event_code').eq(event_code)
    )
    participants = registrations_response['Items']
    
    return create_response(200, {
        'participants': participants
    })