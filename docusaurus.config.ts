import type {Config, PluginConfig} from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import type {PluginOptions as LocalSearchOptions} from '@easyops-cn/docusaurus-search-local';
import { SITE_URL } from './siteUrl';
import {humanPlaybookTree} from './src/data/humanPlaybook';
import authorPagesPlugin from './src/plugins/authorPages';
import docReadTimesPlugin from './src/plugins/docReadTimes';
import {searchIgnoreFiles} from './src/utils/agentMirrorSearchIgnore';

const codeTheme = {
  plain: { color: 'var(--tf-ink-black)', backgroundColor: 'var(--tf-ghost-white)' },
  styles: [
    { types: ['comment', 'prolog', 'doctype', 'cdata'], style: { color: 'var(--tf-primary-navy)' } },
    { types: ['keyword', 'boolean', 'number', 'property', 'tag'], style: { color: 'var(--tf-azure-bold)' } },
    { types: ['string', 'function', 'class-name', 'builtin'], style: { color: 'var(--tf-primary-navy)' } },
  ],
};

const REPO_URL = 'https://github.com/TrilemmaFoundation/build';

const DOC_ISLAND_EDIT_URL = `${REPO_URL}/edit/main/`;

const docsIslandPlugins = [
  {
    id: 'showcase',
    path: 'docs/showcase',
    routeBasePath: 'showcase',
    sidebarPath: false as const,
  },
  {
    id: 'contribute',
    path: 'docs/contribute',
    routeBasePath: 'contribute',
    sidebarPath: false as const,
  },
  {
    id: 'agents',
    path: 'docs/agents',
    routeBasePath: 'agents',
    sidebarPath: './sidebars.agents.ts' as const,
  },
  {
    id: 'templates',
    path: 'docs/templates',
    routeBasePath: 'templates',
    sidebarPath: false as const,
  },
  {
    id: 'archetypes',
    path: 'docs/archetypes',
    routeBasePath: 'archetypes',
    sidebarPath: './sidebars.archetypes.ts' as const,
  },
  {
    id: 'standards',
    path: 'docs/standards',
    routeBasePath: 'standards',
    sidebarPath: './sidebars.standards.ts' as const,
  },
] as const;

const plugins: PluginConfig[] = [
  ...docsIslandPlugins.map(
    (spec): PluginConfig => [
      '@docusaurus/plugin-content-docs',
      {
        id: spec.id,
        path: spec.path,
        routeBasePath: spec.routeBasePath,
        sidebarPath: spec.sidebarPath,
        editUrl: DOC_ISLAND_EDIT_URL,
      },
    ],
  ),
  [
    docReadTimesPlugin,
    {
      docRoots: ['docs/human', ...docsIslandPlugins.map((spec) => spec.path)],
    },
  ],
  authorPagesPlugin,
];

const config: Config = {
  title: 'Build Trilemma',
  tagline:
    'The AI-agent control panel for building microproducts—patterns, templates, standards, and a machine-readable registry.',
  favicon: 'img/favicon.ico',

  headTags: [
    {
      tagName: 'link',
      attributes: {
        rel: 'apple-touch-icon',
        href: '/img/apple-touch-icon.png',
      },
    },
    {
      tagName: 'link',
      attributes: {
        rel: 'icon',
        type: 'image/png',
        sizes: '32x32',
        href: '/img/favicon-32x32.png',
      },
    },
    {
      tagName: 'link',
      attributes: {
        rel: 'icon',
        type: 'image/png',
        sizes: '16x16',
        href: '/img/favicon-16x16.png',
      },
    },
    {
      tagName: 'link',
      attributes: {
        rel: 'manifest',
        href: '/site.webmanifest',
      },
    },
  ],

  url: SITE_URL,
  baseUrl: '/',

  organizationName: 'TrilemmaFoundation',
  projectName: 'build',

  onBrokenLinks: 'throw',
  future: {
    v4: {
      removeLegacyPostBuildHeadAttribute: true,
    },
    faster: true,
  },
  markdown: {
    hooks: {
      onBrokenMarkdownLinks: 'throw',
    },
  },
  themes: [
    [
      '@easyops-cn/docusaurus-search-local',
      {
        hashed: true,
        indexDocs: true,
        indexBlog: false,
        indexPages: false,
        language: 'en',
        docsRouteBasePath: [
          'docs',
          ...docsIslandPlugins.map((spec) => spec.routeBasePath),
        ],
        ignoreFiles: searchIgnoreFiles(humanPlaybookTree),
        searchBarShortcut: true,
        searchBarShortcutKeymap: 'mod+k',
        searchBarPosition: 'right',
        highlightSearchTermsOnTargetPage: false,
        explicitSearchResultPath: true,
      } satisfies LocalSearchOptions,
    ],
  ],

  i18n: {
    defaultLocale: 'en',
    locales: ['en'],
  },

  presets: [
    [
      'classic',
      {
        debug: false,
        docs: {
          path: 'docs/human',
          sidebarPath: './sidebars.ts',
          editUrl: `${REPO_URL}/edit/main/`,
        },
        blog: false,
        pages: {},
        theme: {
          customCss: './src/css/custom.css',
        },
      } satisfies Preset.Options,
    ],
  ],
  plugins,
  clientModules: ['./src/client/vercelAnalytics.ts'],
  stylesheets: [],
  themeConfig: {
    prism: { theme: codeTheme, darkTheme: codeTheme },
    colorMode: {
      defaultMode: 'light',
      disableSwitch: true,
      respectPrefersColorScheme: false,
    },
    metadata: [
      { property: 'og:title', content: 'Build Trilemma' },
      {
        property: 'og:description',
        content:
          'Canonical place to discover microproduct patterns, templates, build instructions, and a machine-readable product registry—for humans and AI agents.',
      },
      // Do not set og:url here — Docusaurus emits the per-page canonical URL.
      { name: 'twitter:card', content: 'summary_large_image' },
    ],
    navbar: {
      logo: {
        alt: 'Trilemma Foundation',
        src: 'img/foundation_white.webp',
        srcDark: 'img/foundation_white.webp',
        href: '/',
        height: 32,
      },
    },
  } satisfies Preset.ThemeConfig,
};

export default config;
