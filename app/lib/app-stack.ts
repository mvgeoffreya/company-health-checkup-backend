import * as cdk from '@aws-cdk/core';
import * as data_page_service from './data_service';
// import * as sqs from '@aws-cdk/aws-sqs';

export class AppStack extends cdk.Stack {
  constructor(scope: cdk.Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);
    new data_page_service.DataService(this, 'DataPages');
  }
}
