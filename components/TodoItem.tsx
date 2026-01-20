
import React from 'react';
import { Todo } from '../types';

interface TodoItemProps {
  todo: Todo;
  onToggle: (id: string, current: boolean) => void;
  onDelete: (id: string) => void;
}

const TodoItem: React.FC<TodoItemProps> = ({ todo, onToggle, onDelete }) => {
  const priorityColors = {
    low: 'bg-green-100 text-green-700',
    medium: 'bg-blue-100 text-blue-700',
    high: 'bg-red-100 text-red-700',
  };

  return (
    <div className={`group flex items-center justify-between p-4 mb-3 transition-all duration-200 border border-slate-200 rounded-xl hover:shadow-md ${todo.is_completed ? 'bg-slate-50 opacity-75' : 'bg-white'}`}>
      <div className="flex items-center space-x-4 flex-1">
        <button 
          onClick={() => onToggle(todo.id, todo.is_completed)}
          className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors ${todo.is_completed ? 'bg-indigo-600 border-indigo-600' : 'border-slate-300 hover:border-indigo-400'}`}
        >
          {todo.is_completed && <i className="fas fa-check text-white text-xs"></i>}
        </button>
        
        <div className="flex-1">
          <h3 className={`font-medium ${todo.is_completed ? 'line-through text-slate-400' : 'text-slate-800'}`}>
            {todo.title}
          </h3>
          <div className="flex items-center mt-1 space-x-2">
            <span className={`text-[10px] px-2 py-0.5 rounded-full font-semibold uppercase ${priorityColors[todo.priority]}`}>
              {todo.priority}
            </span>
            {todo.category && (
              <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-full">
                {todo.category}
              </span>
            )}
          </div>
        </div>
      </div>

      <button 
        onClick={() => onDelete(todo.id)}
        className="text-slate-400 hover:text-red-500 transition-colors p-2"
      >
        <i className="far fa-trash-can"></i>
      </button>
    </div>
  );
};

export default TodoItem;
