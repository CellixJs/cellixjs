import type {ReactNode} from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';
import MountainSvg from '@site/static/img/undraw_docusaurus_mountain.svg';
import TreeSvg from '@site/static/img/undraw_docusaurus_tree.svg';
import ReactSvg from '@site/static/img/undraw_docusaurus_react.svg';

type FeatureItem = {
  title: string;
  Svg: React.ComponentType<React.ComponentProps<'svg'>>;
  description: ReactNode;
};


const FeatureList: FeatureItem[] = [
  {
    title: 'Domain-Driven Design',
    Svg: MountainSvg,
    description: (
      <>
        CellixJs implements sophisticated DDD patterns with bounded contexts,
        aggregates, and entities. Build maintainable business logic with clear
        separation of concerns.
      </>
    ),
  },
  {
    title: 'Enterprise-Ready Architecture',
    Svg: TreeSvg,
    description: (
      <>
        Focus on your business domains while CellixJs handles the infrastructure.
        Built-in support for <code>MongoDB</code>, <code>GraphQL</code>, and 
        <code>Azure Functions</code> deployment.
      </>
    ),
  },
  {
    title: 'Modern TypeScript Stack',
    Svg: ReactSvg,
    description: (
      <>
        Full-stack TypeScript monorepo with Azure Functions, Apollo GraphQL,
        Mongoose ODM, and OpenTelemetry observability. Type-safe from API to UI.
      </>
    ),
  },
];

function Feature({title, Svg, description}: FeatureItem) {
  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg className={styles.featureSvg} role="img" />
      </div>
      <div className="text--center padding-horiz--md">
        <Heading as="h3">{title}</Heading>
        <p>{description}</p>
      </div>
    </div>
  );
}

export default function HomepageFeatures(): ReactNode {
  return (
    <section className={styles.features}>
      <div className="container">
        <div className="row">
          {FeatureList.map((props) => (
            <Feature key={props.title} {...props} />
          ))}
        </div>
      </div>
    </section>
  );
}
