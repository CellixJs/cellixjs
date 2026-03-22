import { projectFiles } from 'archunit';
import { describe, expect, it } from 'vitest';

describe('Dependency Rules', () => {
  describe('Circular Dependencies', () => {
    it('apps should not have circular dependencies', async () => {
      const rule = projectFiles().inFolder('../../apps').should().haveNoCycles();
      await expect(rule).toPassAsync();
    }, 30000);

    it('packages should not have circular dependencies', async () => {
      const rule = projectFiles().inFolder('..').should().haveNoCycles();
      await expect(rule).toPassAsync();
    }, 10000);
  });

  describe('api', () => {
    it('domain layer should not depend on persistence layer', async () => {
    const rule = projectFiles()
      .inFolder('../ocom/domain')
      .shouldNot()
      .dependOnFiles()
      .inFolder('../ocom/persistence');

    await expect(rule).toPassAsync();
  });

  it('domain layer should not depend on infrastructure layer', async () => {
    const rule = projectFiles()
      .inFolder('../ocom/domain')
      .shouldNot()
      .dependOnFiles()
      .inPath('../ocom/service-*/**');

    await expect(rule).toPassAsync();
  });

  it('domain layer should not depend on application services', async () => {
    const rule = projectFiles()
      .inFolder('../ocom/domain')
      .shouldNot()
      .dependOnFiles()
      .inFolder('../ocom/application-services');

    await expect(rule).toPassAsync();
  });

  it('application services should not depend on infrastructure', async () => {
    const rule = projectFiles()
      .inFolder('../ocom/application-services')
      .shouldNot()
      .dependOnFiles()
      .inPath('../ocom/service-*/**');

    await expect(rule).toPassAsync();
  });

  it('GraphQL API layer should not depend on infrastructure directly', async () => {
    const rule = projectFiles()
      .inFolder('../ocom/graphql')
      .shouldNot()
      .dependOnFiles()
      .inPath('../ocom/service-*/**');

    await expect(rule).toPassAsync();
  });

  it('REST API layer should not depend on infrastructure directly', async () => {
      const rule = projectFiles()
        .inFolder('../ocom/rest')
        .shouldNot()
        .dependOnFiles()
        .inPath('../ocom/service-*/**');

      await expect(rule).toPassAsync({ allowEmptyTests: true });
    });
  });

  describe('ui-community', () => {
    it('ui-core should not depend on ui-components', async () => {
      const rule = projectFiles()
        .inFolder('../cellix/ui-core')
        .shouldNot()
        .dependOnFiles()
        .inFolder('../ocom/ui-components');

      await expect(rule).toPassAsync();
    });

    it('ui-core should not depend on ui-community app', async () => {
      const rule = projectFiles()
        .inFolder('../cellix/ui-core')
        .shouldNot()
        .dependOnFiles()
        .inFolder('../../apps/ui-community');

      await expect(rule).toPassAsync();
    });

    it('ui-components should not depend on ui-community app', async () => {
      const rule = projectFiles()
        .inFolder('../ocom/ui-components')
        .shouldNot()
        .dependOnFiles()
        .inFolder('../../apps/ui-community');

      await expect(rule).toPassAsync();
    });
  });
});