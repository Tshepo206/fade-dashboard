"use client";

import { useEffect, useState } from "react";

import {
  getCurrentWorkspace,
  type Workspace,
} from "@/lib/workspace";

export function useCurrentWorkspace() {
  const [workspace, setWorkspace] =
    useState<Workspace | null>(null);

  useEffect(() => {
    let active = true;

    async function loadWorkspace() {
      try {
        const currentWorkspace =
          await getCurrentWorkspace();

        if (active) {
          setWorkspace(currentWorkspace);
        }
      } catch {
        if (active) {
          setWorkspace(null);
        }
      }
    }

    void loadWorkspace();

    return () => {
      active = false;
    };
  }, []);

  return workspace;
}
