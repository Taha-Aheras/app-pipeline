import { Stack, StackProps, CfnOutput, aws_iam as iam } from 'aws-cdk-lib';
import { Construct } from 'constructs';

export interface GitHubOidcProps extends StackProps {
  /**
   * e.g. "your-org/your-repo"
   */
  repoFullName?: string;
  /**
   * e.g. "refs/heads/main" or "refs/tags/*" or use environments
   */
  refPattern?: string;
}

export class GitHubOidcStack extends Stack {
  public readonly roleArnOutput: CfnOutput;

  constructor(scope: Construct, id: string, props?: GitHubOidcProps) {
    super(scope, id, props);

    const repoFullName = props?.repoFullName ?? 'ORG/REPO';   // TODO: set real values
    const refPattern   = props?.refPattern   ?? 'refs/heads/main';

    // 1) OIDC provider for GitHub
    const provider = new iam.OpenIdConnectProvider(this, 'GitHubOIDC', {
      url: 'https://token.actions.githubusercontent.com',
      clientIds: ['sts.amazonaws.com'],
    });

    // 2) Role trusted by GitHub Actions via OIDC
    const role = new iam.Role(this, 'GitHubActionsRole', {
      assumedBy: new iam.WebIdentityPrincipal(provider.openIdConnectProviderArn, {
        StringEquals: {
          'token.actions.githubusercontent.com:aud': 'sts.amazonaws.com',
        },
        // narrow down to your repo + branch
        StringLike: {
          'token.actions.githubusercontent.com:sub': `repo:${repoFullName}:ref:${refPattern}`,
        },
      }),
      description: 'Assumable by GitHub Actions via OIDC',
      // Grant only what deployments need; start with minimal
      managedPolicies: [
        iam.ManagedPolicy.fromAwsManagedPolicyName('AdministratorAccess'), // For demo only — replace with least-privilege!
      ],
    });

    this.roleArnOutput = new CfnOutput(this, 'GitHubActionsRoleArn', {
      value: role.roleArn,
      exportName: 'GitHubActionsRoleArn',
    });
  }
}