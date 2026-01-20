
export type Priority = 'low' | 'medium' | 'high';

export interface Todo {
  id: string;
  title: string;
  description: string | null;
  is_completed: boolean;
  priority: Priority;
  category: string;
  due_date: string | null;
  created_at: string;
}

export interface AISuggestion {
  title: string;
  tasks: string[];
}
