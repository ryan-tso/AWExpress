import json
import sys
import os
import logging
import rds_config as rds_config
import pymysql as pymysql
#rds settings
rds_host = rds_config.rds_host
name = rds_config.db_username
password = rds_config.db_password
db_name = rds_config.db_name

logger = logging.getLogger()
logger.setLevel(logging.INFO)
try:
    conn = pymysql.connect(host=rds_host, user=name, passwd=password, db=db_name, connect_timeout=5)
except pymysql.MySQLError as e:
    logger.error("ERROR: Unexpected error: Could not connect to MySQL instance.")
    logger.error(e)
    sys.exit()

logger.info("SUCCESS: Connection to RDS MySQL instance succeeded")
print("connect successful")
def lambda_handler(event, context):
    """
    This function adds a new product with specified parameters and returns the new product's id
    """
    
    resObj = {}
    resbody = {}
    sql = "select max(productId) as maxId from Product;"
    with conn.cursor() as cur:
        cur.execute(sql)
        res = cur.fetchall()
        maxProduct = res[0]
        maxProductId = maxProduct[0]
        if maxProductId == None:
            maxProductId=1
        picture = None

        categoryId=0
        description=None
        body = json.loads(event['body'])


        productId = maxProductId + 1
        sellerId = int(body['sellerId'])
        productName = body['productName']
        price = float(body['price'])
        quantity = int(body['quantity'])
        if 'description' in body:
            descriptionBody = body['description']
            description = descriptionBody.replace("'", "''")
        if 'picture' in body:
            picture = body['picture']
        status = 1
        if 'categoryId' in body:
            categoryId = int(body['categoryId'])

        sql = ("insert into Product (productId, sellerId, productName, price, description, picture, quantity,status, categoryId) values (%d, %d, '%s', %f, '%s', '%s', %d,%d, %d);" % (productId, sellerId, productName, price, description, picture, quantity,status, categoryId))
        print(sql)
        cur.execute(sql)
        resbody['productId'] = productId
        sql2 = "SELECT MAX(postId) as maxPostId from Post;"
        cur.execute(sql2)
        res = cur.fetchall()
        maxPost = res[0]
        maxPostId = maxPost[0]
        if maxPostId == None:
            maxPostId=1
        postId=maxPostId+1
        sql3 = "INSERT INTO Post (postId, userId,productId,quantity,status) VALUES (%d,%d,%d,%d,%d);" % (postId,sellerId,productId,quantity,1)
        cur.execute(sql3)
        res = cur.fetchall()
        resbody['postId'] = postId

    conn.commit()
    
    
    resObj['statusCode'] = 200
    resObj['headers']={}
    resObj['headers']['Content-Type'] = 'application/json'
    resObj['body'] = json.dumps(resbody)
    
    return resObj

# req = {
#     'body':'{"sellerId":2055,"productName":"Notebook","price":20,"quantity":2, "picture":"https://s3.amazonaws.com/aws.image//tmp/notebook.jpg", "description": "Greatest\' notbook"}'
# }
#
# print(lambda_handler(req,""))