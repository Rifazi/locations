import { DynamoDB, GetItemInput, ScanInput } from '@aws-sdk/client-dynamodb'
import { marshall, unmarshall } from '@aws-sdk/util-dynamodb'

interface UserInput {
    id: string
}

exports.handler = async (event: any) => {

    const { body } = event

    const dynamoClient = new DynamoDB({ 
        region: 'us-east-1' 
    })

    const data = JSON.parse(body) as UserInput
    console.log("Data: " + data)

    const scanLocation: ScanInput = {
        TableName: process.env.LOCATION_TABLE_NAME
    }

    try {
        if (data?.id) {
            const getTLocation: GetItemInput = {
                Key: marshall({
                    id: data.id
                }),
                TableName: process.env.LOCATION_TABLE_NAME
            }

            const { Item } = await dynamoClient.getItem(getTLocation)
            const todo = Item ? unmarshall(Item) : null
    
            return {
                statusCode: 200,
                body: JSON.stringify({ todo })
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