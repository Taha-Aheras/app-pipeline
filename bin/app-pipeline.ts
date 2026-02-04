#!/usr/bin/env node
import * as cdk from 'aws-cdk-lib';
import { AppStack } from '../lib/app-stack';
import { AppPipelineStack } from '../lib/app-pipeline-stack';

const app = new cdk.App();

// Instantiate both stacks
new AppPipelineStack(app, 'AppPipelineStack');
new AppStack(app, 'AppStack', { 
  env: {
    account: process.env.CDK_DEFAULT_ACCOUNT,
    region: process.env.CDK_DEFAULT_REGION
  }
});