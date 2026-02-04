import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigw from 'aws-cdk-lib/aws-apigateway';

export class AppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    const helloFn = new lambda.Function(this, 'HelloFn', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        exports.handler = async () => {
          return { statusCode: 200, body: "Hello from CDK!" };
        };
      `),
    });

    // REST API for Lambda
    const api = new apigw.LambdaRestApi(this, 'HelloApi', {
      handler: helloFn,
      proxy: true
    });

    // Output the URL so GitHub Actions can read it
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
    });
  }
}