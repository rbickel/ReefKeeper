** CI/CD rules
- Do not use timeouts in CI/CD workflows
- When test fails, fail the job. It is really important that we can trust a build. Following jobs can use always() to do cleanup or collect logs, but the failure should be visible in the CI/CD pipeline.