import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as apigateway from "aws-cdk-lib/aws-apigateway"
import { JsonSchemaType } from 'aws-cdk-lib/aws-apigateway';
import { RestAPIConstruct, RestAPIProp } from './rest-api-construct';
import { AttributeType, BillingMode, Table } from 'aws-cdk-lib/aws-dynamodb';
import { RemovalPolicy } from 'aws-cdk-lib';

export class LocationsStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const api = new apigateway.RestApi(this, "locations-api", {
      restApiName: "Locations API",
      description: "This services the Locations API",
      defaultCorsPreflightOptions: {
        allowOrigins: apigateway.Cors.ALL_ORIGINS,
        allowMethods: apigateway.Cors.ALL_METHODS,
        allowHeaders: ["*"],
      },
    })

    const table = new Table(this, 'locationsTable', {
      partitionKey: {
        name: 'id',
        type: AttributeType.STRING
      },
      billingMode: BillingMode.PAY_PER_REQUEST,
      removalPolicy: RemovalPolicy.DESTROY
    })

    const name = "location"
    const validatedPostProperties = {
      name: { type: JsonSchemaType.STRING },
      city: { type: JsonSchemaType.STRING },
      state: { type: JsonSchemaType.STRING },
      country: { type: JsonSchemaType.STRING }
    }

    const requiredPostProperties = [
      "name",
      "city",
      "state",
      "country",
    ]

    var postProp: RestAPIProp = {
      name,
      method: "POST",
      api,
      table,
      validatedProperties: validatedPostProperties,
      requiredProperties: requiredPostProperties
    }

    const postAPI = new RestAPIConstruct(this, "locationPOST", postProp)

    const validatedGetProperties = {
      id: { type: JsonSchemaType.STRING }
    }

    var getProp: RestAPIProp = {
      name,
      method: "GET",
      api,
      table,
      validatedProperties: validatedGetProperties,
      resource: postAPI.resource,
    }

    new RestAPIConstruct(this, "locationGET", getProp)
  }
}