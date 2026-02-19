export type ModuleStatus = 'draft' | 'published' | 'archived';

/**
 * Module resource structure
 */
export interface ModuleResource {
  /** Resource name */
  name: string;
  /** Resource URL or identifier */
  url: string;
  /** Resource size in bytes (for files) */
  size?: number;
}

export interface Module {
  id: string;
  order: number;
  status: ModuleStatus;
  title: string;
  description: string;
  resources?: ModuleResource[];
} 