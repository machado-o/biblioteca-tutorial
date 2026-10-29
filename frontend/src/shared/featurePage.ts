import type { ComponentType } from "react";

/** O que cada page.tsx exporta para o App montar menu e rotas. */
export type FeaturePage = { useCase: string; title: string; path: string; Component: ComponentType };
