
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from './lib/supabase';
import { Todo, Priority } from './types';
import { getSmartBreakdown, getPriorityAdvice } from './services/geminiService';
import TodoItem from './components/TodoItem';

const App: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [isBreakingDown, setIsBreakingDown] = useState(false);
  const [isGettingAdvice, setIsGettingAdvice] = useState(false);

  const fetchTodos = useCallback(async () => {
    try {
      setLoading(true);
      const { data, error } = await supabase
        .from('todos')
        .select('*')
        .order('created_at', { ascending: false });

      if (error) throw error;
      setTodos(data || []);
    } catch (error) {
      console.error('Error fetching todos:', error);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    fetchTodos();
  }, [fetchTodos]);

  const addTodo = async (e?: React.FormEvent) => {
    e?.preventDefault();
    if (!newTodoTitle.trim()) return;

    try {
      const { error } = await supabase.from('todos').insert([
        { title: newTodoTitle, priority: 'medium', category: 'General' }
      ]);
      if (error) throw error;
      setNewTodoTitle('');
      fetchTodos();
    } catch (error) {
      alert('할일을 추가하는 도중 오류가 발생했습니다.');
    }
  };

  const toggleTodo = async (id: string, currentStatus: boolean) => {
    try {
      const { error } = await supabase
        .from('todos')
        .update({ is_completed: !currentStatus })
        .eq('id', id);
      if (error) throw error;
      fetchTodos();
    } catch (error) {
      console.error('Error updating todo:', error);
    }
  };

  const deleteTodo = async (id: string) => {
    try {
      const { error } = await supabase.from('todos').delete().eq('id', id);
      if (error) throw error;
      fetchTodos();
    } catch (error) {
      console.error('Error deleting todo:', error);
    }
  };

  const handleSmartBreakdown = async () => {
    if (!newTodoTitle.trim()) {
      alert('목표를 먼저 입력해주세요! AI가 단계를 나누어 드립니다.');
      return;
    }

    setIsBreakingDown(true);
    const subtasks = await getSmartBreakdown(newTodoTitle);
    
    if (subtasks.length > 0) {
      try {
        const inserts = subtasks.map(task => ({
          title: task,
          priority: 'medium' as Priority,
          category: 'AI Breakdown'
        }));
        const { error } = await supabase.from('todos').insert(inserts);
        if (error) throw error;
        setNewTodoTitle('');
        fetchTodos();
      } catch (error) {
        console.error('Error adding AI tasks:', error);
      }
    }
    setIsBreakingDown(false);
  };

  const handleGetAdvice = async () => {
    const activeTasks = todos.filter(t => !t.is_completed).map(t => t.title);
    if (activeTasks.length === 0) {
      setAiAdvice("현재 진행 중인 할 일이 없습니다. 새로운 목표를 설정해볼까요?");
      return;
    }
    
    setIsGettingAdvice(true);
    const advice = await getPriorityAdvice(activeTasks);
    setAiAdvice(advice || "집중해서 하나씩 해결해 보세요!");
    setIsGettingAdvice(false);
  };

  const completedCount = todos.filter(t => t.is_completed).length;
  const progressPercent = todos.length > 0 ? Math.round((completedCount / todos.length) * 100) : 0;

  return (
    <div className="max-w-2xl mx-auto px-4 py-12">
      {/* Header */}
      <header className="mb-10 text-center md:text-left md:flex md:items-center md:justify-between">
        <div>
          <h1 className="text-4xl font-extrabold text-slate-900 flex items-center justify-center md:justify-start gap-3 mb-2">
            <span className="bg-indigo-600 text-white p-2 rounded-2xl shadow-lg shadow-indigo-200">
              <i className="fas fa-check-double scale-75"></i>
            </span>
            FocusFlow
          </h1>
          <p className="text-slate-500 font-medium">Smart AI Task Management</p>
        </div>
        <div className="mt-6 md:mt-0">
          <button 
            onClick={handleGetAdvice}
            disabled={isGettingAdvice}
            className="group relative inline-flex items-center gap-2 bg-white text-indigo-600 font-bold px-5 py-3 rounded-2xl border border-indigo-100 hover:border-indigo-300 hover:bg-indigo-50 transition-all shadow-sm active:scale-95 disabled:opacity-50"
          >
            {isGettingAdvice ? (
              <i className="fas fa-circle-notch animate-spin"></i>
            ) : (
              <i className="fas fa-wand-magic-sparkles"></i>
            )}
            AI 코칭 받기
          </button>
        </div>
      </header>

      {/* Progress & Stats */}
      <section className="glass rounded-[2rem] p-8 mb-10 shadow-xl shadow-slate-200/50">
        <div className="flex justify-between items-end mb-6">
          <div>
            <span className="text-4xl font-black text-slate-900 tracking-tight">{progressPercent}%</span>
            <p className="text-slate-500 text-sm font-semibold uppercase tracking-wider mt-1">오늘의 진행률</p>
          </div>
          <div className="text-right">
            <div className="flex items-center gap-2 justify-end mb-1">
              <span className="w-2 h-2 rounded-full bg-indigo-500"></span>
              <span className="text-slate-800 font-bold text-lg">{completedCount} <span className="text-slate-400 font-normal">/ {todos.length}</span></span>
            </div>
            <p className="text-slate-500 text-sm font-semibold uppercase tracking-wider">완료 항목</p>
          </div>
        </div>
        <div className="w-full bg-slate-100 h-4 rounded-full overflow-hidden p-1">
          <div 
            className="bg-indigo-600 h-full rounded-full transition-all duration-1000 ease-out shadow-inner" 
            style={{ width: `${progressPercent}%` }}
          ></div>
        </div>
      </section>

      {/* AI Advice Box */}
      {aiAdvice && (
        <div className="mb-10 p-6 bg-gradient-to-br from-indigo-50 to-white border border-indigo-100 rounded-[1.5rem] relative overflow-hidden animate-fade-in group">
          <div className="absolute top-0 right-0 p-4 opacity-10 group-hover:opacity-20 transition-opacity">
            <i className="fas fa-quote-right text-4xl text-indigo-600"></i>
          </div>
          <div className="flex items-start gap-4">
            <div className="bg-indigo-600 text-white w-10 h-10 rounded-xl flex items-center justify-center flex-shrink-0 shadow-lg shadow-indigo-200">
              <i className="fas fa-brain"></i>
            </div>
            <div className="pr-6">
              <h4 className="text-sm font-bold text-indigo-900 mb-1">Gemini의 생산성 가이드</h4>
              <p className="text-slate-700 leading-relaxed font-medium">{aiAdvice}</p>
            </div>
            <button 
              onClick={() => setAiAdvice(null)} 
              className="absolute top-4 right-4 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>
      )}

      {/* Input Section */}
      <section className="mb-10">
        <form onSubmit={addTodo} className="space-y-3">
          <div className="relative group">
            <input
              type="text"
              value={newTodoTitle}
              onChange={(e) => setNewTodoTitle(e.target.value)}
              placeholder="무엇을 이루고 싶나요? 목표를 입력하세요..."
              className="w-full pl-6 pr-14 py-5 bg-white border-2 border-slate-100 rounded-3xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-slate-800 text-lg shadow-sm placeholder:text-slate-400"
            />
            <button 
              type="submit"
              className="absolute right-3 top-1/2 -translate-y-1/2 w-11 h-11 bg-slate-900 text-white rounded-2xl flex items-center justify-center hover:bg-black transition-colors shadow-lg active:scale-95"
            >
              <i className="fas fa-plus"></i>
            </button>
          </div>
          <div className="flex justify-between items-center px-2">
             <button 
              type="button"
              onClick={handleSmartBreakdown}
              disabled={isBreakingDown}
              className={`group text-sm font-bold flex items-center gap-2 px-5 py-2.5 rounded-2xl transition-all ${isBreakingDown ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-slate-900 text-white hover:bg-slate-800 shadow-md hover:shadow-lg active:scale-95'}`}
            >
              {isBreakingDown ? (
                <>
                  <i className="fas fa-spinner animate-spin"></i>
                  분석 중...
                </>
              ) : (
                <>
                  <i className="fas fa-sitemap text-indigo-400 group-hover:scale-110 transition-transform"></i>
                  AI로 단계 나누기
                </>
              )}
            </button>
            <p className="text-[11px] text-slate-400 font-medium">단축키: Enter로 즉시 추가</p>
          </div>
        </form>
      </section>

      {/* Todo List */}
      <section className="space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-40">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 font-bold text-slate-600">Supabase 연결 중...</p>
          </div>
        ) : todos.length === 0 ? (
          <div className="text-center py-20 bg-white border-4 border-dashed border-slate-50 rounded-[2.5rem] group hover:border-indigo-50 transition-colors">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-indigo-50 transition-colors">
              <i className="fas fa-feather-pointed text-3xl text-slate-200 group-hover:text-indigo-200 transition-colors"></i>
            </div>
            <h3 className="text-slate-800 font-bold text-xl mb-2">오늘의 여정을 시작하세요</h3>
            <p className="text-slate-400 font-medium px-10">첫 번째 할 일을 입력하거나 AI 브레이크다운 기능을 사용해보세요.</p>
          </div>
        ) : (
          <div className="space-y-1 animate-slide-up">
            <div className="flex items-center justify-between px-4 mb-4">
              <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">List View</h2>
              <span className="text-[10px] bg-slate-100 text-slate-500 px-2 py-0.5 rounded-md font-bold">LATEST FIRST</span>
            </div>
            {todos.map((todo) => (
              <TodoItem 
                key={todo.id} 
                todo={todo} 
                onToggle={toggleTodo} 
                onDelete={deleteTodo} 
              />
            ))}
          </div>
        )}
      </section>

      {/* Footer */}
      <footer className="mt-20 pt-10 border-t border-slate-100 text-center">
        <p className="text-slate-300 text-[10px] font-bold tracking-widest uppercase mb-1">FocusFlow AI Productivity Suite</p>
        <p className="text-slate-400 text-xs">&copy; 2024. Powering your focus with Supabase & Gemini.</p>
      </footer>
    </div>
  );
};

export default App;
