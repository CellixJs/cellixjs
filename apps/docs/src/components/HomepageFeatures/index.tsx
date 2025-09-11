import type {ReactNode} from 'react';
import clsx from 'clsx';
import Heading from '@theme/Heading';
import styles from './styles.module.css';
import MountainSvg from '@site/static/img/undraw_docusaurus_mountain.svg';
import TreeSvg from '@site/static/img/undraw_docusaurus_tree.svg';
import ReactSvg from '@site/static/img/undraw_docusaurus_react.svg';

type FeatureItem = {
  id: string;
  title: string;
  Svg: React.ComponentType<React.ComponentProps<'svg'>>;
  description: ReactNode;
};


const FeatureList: FeatureItem[] = [
  {
    id: 'ddd',
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
    id: 'enterprise',
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
    id: 'typescript',
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

function Feature({id, title, Svg, description}: FeatureItem) {
  const titleId = `${id}-title`;

  return (
    <div className={clsx('col col--4')}>
      <div className="text--center">
        <Svg
          // biome-ignore lint:useLiteralKeys
          className={styles['featureSvg']}
          role="img"
          aria-labelledby={titleId}
        >
          <title id={titleId}>{title}</title>
        </Svg>
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
    // biome-ignore lint:useLiteralKeys
    <section className={styles['features']}>
      <div className="container">
        <div className="row">
          {FeatureList.map(({id, title, Svg, description}) => (
            <Feature key={id} id={id} title={title} Svg={Svg} description={description} />
          ))}
        </div>
      </div>
    </section>
  );
}
