import { DynamoDB, GetItemInput, ScanInput } from '@aws-sdk/client-dynamodb'
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb'

exports.handler = async (event: any) => {
    const dynamoClient = new DynamoDB({ 
        region: 'us-east-1' 
    })

    const querystring = event.queryStringParameters
    const id = querystring?.id

    console.log("query: " + querystring)
    console.log("ID: " + id)

    const scanLocation: ScanInput = {
        TableName: process.env.LOCATION_TABLE_NAME
    }

    try {
        if (id) {
            const getLocation: GetItemInput = {
                Key: marshall({
                    id
                }),
                TableName: process.env.LOCATION_TABLE_NAME
            }

            const { Item } = await dynamoClient.getItem(getLocation)
            const location = Item ? unmarshall(Item) : null
    
            return {
                statusCode: 200,
                body: JSON.stringify({ location })
            }
        }

        else {
            const { Items } = await dynamoClient.scan(scanLocation)
            const userData = Items ? Items.map(item => unmarshall(item)) : []
            return {
                statusCode: 200,
                body: JSON.stringify(userData)
            }
        }
    } catch (err) {
        console.log(err)
        return {
            statusCode: 400,
            body: JSON.stringify({
                message: 'something went wrong'
            })
        }
    }
}