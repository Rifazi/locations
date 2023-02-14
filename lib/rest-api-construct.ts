import * as cdk from "aws-cdk-lib"
import { Construct } from "constructs"
import * as apigateway from "aws-cdk-lib/aws-apigateway"
import { Table } from 'aws-cdk-lib/aws-dynamodb';

import {
  JsonSchemaType,
  JsonSchemaVersion,
  LambdaIntegration,
} from "aws-cdk-lib/aws-apigateway"
import { NodejsFunction } from "aws-cdk-lib/aws-lambda-nodejs"

export interface RestAPIProp {
  name: string
  method: "GET" | "POST" | "PUT" | "DELETE"
  api: cdk.aws_apigateway.RestApi
  resource?: cdk.aws_apigateway.Resource
  table: Table,
  validatedProperties?: { [name: string]: cdk.aws_apigateway.JsonSchema }
  requiredProperties?: string[]
}

export class RestAPIConstruct extends Construct {
  public readonly resource: cdk.aws_apigateway.Resource

  constructor(scope: Construct, id: string, prop: RestAPIProp) {
    super(scope, id)

    const lambdaFunction = new NodejsFunction(this, prop.name, {
      entry: "./lambdas/" + prop.name + prop.method + ".ts",
      handler: "handler",
      environment: {
        LOCATION_TABLE_NAME: prop.table.tableName
      }
    })

    //Probably want to be more granular with access depending on type of lambda
    prop.table.grantReadWriteData(lambdaFunction)

    if (prop.resource) {
      this.resource = prop.resource
    } else {
      this.resource = prop.api.root.addResource(prop.name)
    }
    
    var validatedResource = this.resource
    const validatorName = prop.name + prop.method + "Validator"

    var requestParameters: { [param: string]: boolean } = {}

    if (prop.method == "GET" || prop.method == "DELETE") {
      if (prop.requiredProperties) {
        prop.requiredProperties.forEach((property) => {
          var paramKey = "method.request.querystring." + property
          requestParameters[paramKey] = true
        })
      }

      const requestValidatorOptions = new apigateway.RequestValidator(
        scope,
        validatorName,
        {
          restApi: prop.api,
          requestValidatorName: validatorName,
          validateRequestBody: false,
          validateRequestParameters: true,
        }
      )

      validatedResource.addMethod(
        prop.method,
        new LambdaIntegration(lambdaFunction),
        {
          requestParameters: requestParameters,
          requestValidator: requestValidatorOptions,
        }
      )
    } else {
      const modelName = prop.name + prop.method + "Model"

      const locationModel = prop.api.addModel(modelName, {
        contentType: "application/json",
        modelName: modelName,
        schema: {
          schema: JsonSchemaVersion.DRAFT4,
          title: modelName,
          type: JsonSchemaType.OBJECT,
          properties: prop.validatedProperties,
          required: prop.requiredProperties,
        },
      })

      const postValidator = prop.api.addRequestValidator(
        prop.name + prop.method + "Validator",
        {
          validateRequestParameters: true,
          validateRequestBody: true,
        }
      )

      validatedResource.addMethod(
        prop.method,
        new LambdaIntegration(lambdaFunction),
        {
          requestParameters: requestParameters,
          requestModels: {
            "application/json": locationModel,
          },
          requestValidator: postValidator,
        }
      )
    }
  }
}
