import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';

export class AppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // 1) Lambda Function
    const fn = new lambda.Function(this, 'HelloFn', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        exports.handler = async () => ({
          statusCode: 200,
          headers: { "content-type": "application/json" },
          body: JSON.stringify({ msg: "Hello from the improved CDK pipeline!" })
        });
      `),
    });

    // 2) API Gateway exposing Lambda
    const api = new apigw.LambdaRestApi(this, 'HelloApi', {
      handler: fn,
      proxy: true,
    });

    // 3) CloudWatch Dashboard
    const dashboard = new cloudwatch.Dashboard(this, 'PipelineDashboard', {
      dashboardName: 'CDK-Pipeline-Demo-Dashboard',
    });

    // Add common metrics widgets
    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: "Lambda Invocations",
        left: [fn.metricInvocations()],
      }),
      new cloudwatch.GraphWidget({
        title: "Lambda Errors",
        left: [fn.metricErrors()],
      }),
      new cloudwatch.GraphWidget({
        title: "API Gateway 5XX",
        left: [
          api.metricServerError(),
        ],
      })
    );

    // 4) Output
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'Invoke URL of the API Gateway',
      exportName: 'AppApiUrl',
    });

    new cdk.CfnOutput(this, 'DashboardName', {
      value: dashboard.dashboardName,
      description: 'CloudWatch Dashboard Created',
      exportName: 'AppDashboardName',
    });
  }
}