import type { Config } from '@docusaurus/types';
import type * as Preset from '@docusaurus/preset-classic';
import { themes as prismThemes } from 'prism-react-renderer';

const config: Config = {
  title: 'Sublime UI',
  tagline: 'Write the non-UI parts once. Run on mobile, web, and desktop — in TypeScript.',
  favicon: 'img/favicon.svg',

  // GitHub Pages (project site at https://sublime-ui.github.io/sublime-ui/)
  url: 'https://sublime-ui.github.io',
  baseUrl: '/sublime-ui/',
  organizationName: 'sublime-ui',
  projectName: 'sublime-ui',
  deploymentBranch: 'gh-pages',
  trailingSlash: false,

  onBrokenLinks: 'warn',

  i18n: { defaultLocale: 'en', locales: ['en'] },

  markdown: { hooks: { onBrokenMarkdownLinks: 'warn' } },

  // Brand fonts (Strata): Sora · Manrope · IBM Plex Mono — self-hosted, offline-safe.
  clientModules: ['./src/fonts.ts'],

  plugins: [
    [
      '@docusaurus/plugin-content-docs',
      {
        id: 'components',
        path: 'components',
        routeBasePath: 'components',
        sidebarPath: './sidebarsComponents.ts',
        editUrl: 'https://github.com/sublime-ui/sublime-ui/tree/main/website/',
      },
    ],
    // Preserve old URLs after the 2026-06 docs restructure (Diátaxis: Getting
    // Started → Core Concepts → Platforms → Guides → Reference). Maps every
    // retired path to its canonical home so bookmarks/links keep working.
    [
      '@docusaurus/plugin-client-redirects',
      {
        redirects: [
          { from: '/docs/framework/overview', to: '/docs/core-concepts/models' },
          { from: '/docs/framework/models', to: '/docs/core-concepts/models' },
          { from: '/docs/framework/project-structure', to: '/docs/core-concepts/project-structure' },
          { from: '/docs/library/overview', to: '/docs/core-concepts/components' },
          { from: '/docs/navigation/storybook', to: '/docs/core-concepts/navigation' },
          { from: '/docs/core-concepts/storybook', to: '/docs/core-concepts/navigation' },
          { from: '/docs/devkit/overview', to: '/docs/reference/cli' },
          { from: '/docs/getting-started/commands', to: '/docs/reference/cli' },
          { from: '/docs/troubleshooting', to: '/docs/reference/troubleshooting' },
          { from: '/docs/learning-path', to: '/docs/getting-started' },
          { from: '/docs/cookbook', to: '/docs/guides' },
          { from: '/docs/cookbook/coming-from-web', to: '/docs/guides/coming-from-web' },
          { from: '/docs/cookbook/coming-from-react-native', to: '/docs/guides/coming-from-react-native' },
          { from: '/docs/cookbook/coming-from-flutter', to: '/docs/guides/coming-from-flutter' },
          { from: '/docs/web/overview', to: '/docs/platforms/web/overview' },
          { from: '/docs/web/routing', to: '/docs/platforms/web/routing' },
          { from: '/docs/web/styling', to: '/docs/core-concepts/theming' },
          { from: '/docs/mobile/overview', to: '/docs/platforms/mobile/overview' },
          { from: '/docs/mobile/running', to: '/docs/platforms/mobile/running' },
          { from: '/docs/mobile/building', to: '/docs/platforms/mobile/building' },
          { from: '/docs/mobile/theming', to: '/docs/core-concepts/theming' },
          { from: '/docs/desktop/overview', to: '/docs/platforms/desktop/overview' },
          { from: '/docs/desktop/packaging', to: '/docs/platforms/desktop/packaging' },
          { from: '/docs/desktop/native-bridge', to: '/docs/core-concepts/native-calls' },
        ],
      },
    ],
  ],

  presets: [
    [
      'classic',
      {
        docs: {
          routeBasePath: '/docs', // landing page owns '/'
          sidebarPath: './sidebars.ts',
          editUrl: 'https://github.com/sublime-ui/sublime-ui/tree/main/website/',
        },
        blog: false,
        theme: { customCss: './src/css/custom.css' },
      } satisfies Preset.Options,
    ],
  ],

  themeConfig: {
    image: 'img/logo.svg',
    navbar: {
      title: 'Sublime UI',
      logo: { alt: 'Sublime UI', src: 'img/logo.svg' },
      items: [
        { type: 'docSidebar', sidebarId: 'docs', position: 'left', label: 'Docs' },
        {
          type: 'docSidebar',
          sidebarId: 'componentsSidebar',
          docsPluginId: 'components',
          position: 'left',
          label: 'Components',
        },
        { href: 'https://github.com/sublime-ui/sublime-ui', label: 'GitHub', position: 'right' },
      ],
    },
    footer: {
      style: 'dark',
      links: [
        {
          title: 'Docs',
          items: [
            { label: 'Introduction', to: '/docs/' },
            { label: 'Getting Started', to: '/docs/getting-started' },
            { label: 'Core Concepts', to: '/docs/core-concepts/overview' },
            { label: 'Reference', to: '/docs/reference/cli' },
          ],
        },
        {
          title: 'More',
          items: [{ label: 'GitHub', href: 'https://github.com/sublime-ui/sublime-ui' }],
        },
      ],
      copyright: `Copyright © ${new Date().getFullYear()} Sublime UI · build once · ship everywhere.`,
    },
    prism: { theme: prismThemes.github, darkTheme: prismThemes.dracula },
  } satisfies Preset.ThemeConfig,
};

export default config;
