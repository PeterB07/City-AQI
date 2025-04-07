/// <reference types="vite/client" />

interface ImportMetaEnv {
  readonly VITE_WAQI_API_KEY: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}

declare module '@heroicons/react/24/solid' {
  export const ArrowUpIcon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  export const ArrowDownIcon: React.ComponentType<React.SVGProps<SVGSVGElement>>
  export const ArrowRightIcon: React.ComponentType<React.SVGProps<SVGSVGElement>>
}