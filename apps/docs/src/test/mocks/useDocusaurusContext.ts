interface DocusaurusContext {
  siteConfig: {
    title: string;
    tagline: string;
  };
}

const useDocusaurusContext = (): { siteConfig: DocusaurusContext['siteConfig'] } => ({
  siteConfig: {
    title: 'CellixJs Docs',
    tagline: 'Domain-Driven Design for Modern Azure Applications',
  },
});

export default useDocusaurusContext;
