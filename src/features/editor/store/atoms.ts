import { atom } from "jotai";
import type { ReactFlowInstance } from "@xyflow/react";

export const editorAtom = atom<ReactFlowInstance | null>(null);
