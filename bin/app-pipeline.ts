#!/usr/bin/env node
import 'source-map-support/register';
import * as cdk from 'aws-cdk-lib';
import { AppStack } from '../lib/app-stack';
import { GitHubOidcStack } from '../lib/github-oidc-stack';

const app = new cdk.App();

// 1) OIDC stack (creates IdP + role for Actions)
new GitHubOidcStack(app, 'GitHubOidcStack', {
  // You can parameterize account/region via env if you like
});

// 2) App stack (Lambda + API)
new AppStack(app, 'AppStack');