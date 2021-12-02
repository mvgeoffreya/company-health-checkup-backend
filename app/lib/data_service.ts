import * as core from "@aws-cdk/core";
import * as apigateway from "@aws-cdk/aws-apigateway";
import * as lambda from "@aws-cdk/aws-lambda";
import * as s3 from "@aws-cdk/aws-s3";
import { Duration } from "@aws-cdk/core";

export class DataService extends core.Construct {
  constructor(scope: core.Construct, id: string) {
    super(scope, id);

    const bucket = new s3.Bucket(this, "Data");
    const nodeLayer = new lambda.LayerVersion(this, 'node-layer', {
      compatibleRuntimes: [
        lambda.Runtime.NODEJS_12_X,
        lambda.Runtime.NODEJS_14_X,
      ],
      code: lambda.Code.fromAsset('layer/node'),
      description: 'node-layer',
    });

    const handler = new lambda.Function(this, "queryData", {
      runtime: lambda.Runtime.NODEJS_14_X, // So we can use async in dataPage.js
      code: lambda.Code.fromAsset("resources"),
      handler: "data.main",
      environment: {
        BUCKET: bucket.bucketName
      },
      layers: [nodeLayer],
      timeout: Duration.minutes(15),
      memorySize: 10240
    });

    bucket.grantReadWrite(handler); // was: handler.role);

    const api = new apigateway.RestApi(this, "data-page-api", {
      restApiName: "Data Page Service",
      description: "This service serves data page."
    });
    const handlerCompany = new lambda.Function(this, "queryCompany", {
      runtime: lambda.Runtime.NODEJS_14_X, // So we can use async in dataPage.js
      code: lambda.Code.fromAsset("resources"),
      handler: "company.main",
      environment: {
        BUCKET: bucket.bucketName
      },
      layers: [nodeLayer],
      timeout: Duration.minutes(15),
      memorySize: 10240
    });
    const postDataPageIntegration = new apigateway.LambdaIntegration(handler);
    const getDataPageIntegration = new apigateway.LambdaIntegration(handlerCompany);
    const dataPage = api.root.addMethod("POST",postDataPageIntegration);
    const companyPage = api.root.addMethod("GET",getDataPageIntegration);
  }
}