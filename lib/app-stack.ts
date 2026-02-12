import * as cdk from 'aws-cdk-lib';
import { Construct } from 'constructs';
import * as lambda from 'aws-cdk-lib/aws-lambda';
import * as apigw from 'aws-cdk-lib/aws-apigateway';
import * as cloudwatch from 'aws-cdk-lib/aws-cloudwatch';
import * as dynamodb from 'aws-cdk-lib/aws-dynamodb';
import * as s3 from 'aws-cdk-lib/aws-s3';

export class AppStack extends cdk.Stack {
  constructor(scope: Construct, id: string, props?: cdk.StackProps) {
    super(scope, id, props);

    // ---------------------------------------------------------
    // 1) DynamoDB Table
    // ---------------------------------------------------------
    const table = new dynamodb.Table(this, 'DemoTable', {
      partitionKey: { name: 'id', type: dynamodb.AttributeType.STRING },
      billingMode: dynamodb.BillingMode.PAY_PER_REQUEST,
      tableName: 'DemoPipelineTable'
    });

    // ---------------------------------------------------------
    // 2) S3 Bucket
    // ---------------------------------------------------------
    const bucket = new s3.Bucket(this, 'DemoBucket', {
      bucketName: `demo-pipeline-bucket-${this.account}-${this.region}`,
      versioned: true,
      removalPolicy: cdk.RemovalPolicy.DESTROY,
      autoDeleteObjects: true
    });

    // ---------------------------------------------------------
    // 3) Lambda – Hello World
    // ---------------------------------------------------------
    const helloFn = new lambda.Function(this, 'HelloFn', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        exports.handler = async () => ({
          statusCode: 200,
          body: JSON.stringify({ message: "Hello from the CI/CD pipeline!" })
        });
      `),
    });

    // ---------------------------------------------------------
    // 4) Lambda – Metrics Reporter
    // ---------------------------------------------------------
    const metricsFn = new lambda.Function(this, 'MetricsFn', {
      runtime: lambda.Runtime.NODEJS_20_X,
      handler: 'index.handler',
      code: lambda.Code.fromInline(`
        exports.handler = async () => ({
          statusCode: 200,
          body: JSON.stringify({ metrics: "Some runtime metrics here!" })
        });
      `),
    });

    // ---------------------------------------------------------
    // 5) API Gateway with Routes
    // ---------------------------------------------------------
    const api = new apigw.RestApi(this, 'DemoApi', {
      restApiName: 'Demo Pipeline API',
      deployOptions: {
        stageName: 'prod'
      }
    });

    const helloRoute = api.root.addResource('hello');
    helloRoute.addMethod('GET', new apigw.LambdaIntegration(helloFn));

    const metricsRoute = api.root.addResource('metrics');
    metricsRoute.addMethod('GET', new apigw.LambdaIntegration(metricsFn));

    // 6) CloudWatch Dashboard
   
    const dashboard = new cloudwatch.Dashboard(this, 'PipelineDashboard', {
      dashboardName: 'Enhanced-Pipeline-Dashboard',
    });

    dashboard.addWidgets(
      new cloudwatch.GraphWidget({
        title: "Lambda Invocations",
        left: [helloFn.metricInvocations(), metricsFn.metricInvocations()]
      }),
      new cloudwatch.GraphWidget({
        title: "Lambda Errors",
        left: [helloFn.metricErrors(), metricsFn.metricErrors()]
      }),
      new cloudwatch.GraphWidget({
        title: "API 4XX Errors",
        left: [api.metricClientError()]
      }),
      new cloudwatch.GraphWidget({
        title: "API 5XX Errors",
        left: [api.metricServerError()]
      }),
      new cloudwatch.GraphWidget({
        title: "DynamoDB Read/Write",
        left: [table.metricConsumedReadCapacityUnits()],
        right: [table.metricConsumedWriteCapacityUnits()]
      })
    );

    // ---------------------------------------------------------
    // 7) Outputs
    // ---------------------------------------------------------
    new cdk.CfnOutput(this, 'ApiUrl', {
      value: api.url,
      description: 'Invoke URL of the API'
    });

    new cdk.CfnOutput(this, 'BucketName', {
      value: bucket.bucketName
    });

    new cdk.CfnOutput(this, 'DynamoTableName', {
      value: table.tableName
    });

    new cdk.CfnOutput(this, 'DashboardName', {
      value: dashboard.dashboardName
    });
  }
}