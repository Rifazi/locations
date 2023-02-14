import { APIGatewayProxyResultV2 } from "aws-lambda";
import { DynamoDB, PutItemInput } from '@aws-sdk/client-dynamodb'
import { marshall } from '@aws-sdk/util-dynamodb'
import { v4 as uuid } from 'uuid'
import { latLongFetch } from "./latLongFetcher";
import { LocationPostRequest } from "./LocationPostRequest";

exports.handler = async (event: any) => {
    
    interface Location {
        id?: string
        name: string
        city: string
        state: string
        country: string
        longitude?: string
        latitude?: string
    }

    const { body } = event
    if (!body) {
        return sendFail('invalid request')
    }

    const { id, name, city, state, country } = JSON.parse(body) as LocationPostRequest

    const dynamoClient = new DynamoDB({ 
        region: 'us-east-1' 
    })

    const location: Location = {
        id: id ?? uuid(), name, city, state, country
    }

    try {
        const latLong = await latLongFetch(location)
        const latLongData = latLong.data[0]
        location.latitude = latLongData.lat
        location.longitude = latLongData.lon

        console.log("lat/long: " + JSON.stringify(latLongData))
        console.log("Location to insert: " + JSON.stringify(location))

        const locationParams: PutItemInput = {
            Item: marshall(location),
            TableName: process.env.LOCATION_TABLE_NAME
        }

        await dynamoClient.putItem(locationParams)
        
        return {
            statusCode: 200,
            body: JSON.stringify({ location })    
        }

    } catch (err) {
        console.log(err)
        return sendFail('something went wrong')
    }
}

function sendFail(message: string): APIGatewayProxyResultV2 {
    return {
        statusCode: 400,
        body: JSON.stringify({ message })
    }
}