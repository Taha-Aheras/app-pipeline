import { Stack, StackProps, Duration, CfnOutput } from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigw from 'aws-cdk-lib/aws-apigateway';

export class AppStack extends Stack {
  public readonly apiUrlOutput: CfnOutput;

  constructor(scope: Construct, id: string, props?: StackProps) {
    super(scope, id, props);

    const fn = new lambda.Function(this, 'HelloFn', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        exports.handler = async () => ({
          statusCode: 200,
          headers: { 'content-type': 'application/json' },
          body: JSON.stringify({ ok: true, message: 'Hello from CDK + Lambda!' })
        });
      `),
      timeout: Duration.seconds(5),
    });

    const api = new apigw.LambdaRestApi(this, 'HelloApi', {
      handler: fn,
      proxy: true,
    });

    this.apiUrlOutput = new CfnOutput(this, 'ApiUrl', {
      value: api.url, // ends with '/'
      exportName: 'AppApiUrl',
    });
  }
}