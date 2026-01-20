
import React, { useState, useEffect, useCallback } from 'react';
import { supabase } from './lib/supabase';
import { Todo, Priority } from './types';
import { getDayPlanner, getPriorityAdvice } from './services/geminiService';
import TodoItem from './components/TodoItem';

const App: React.FC = () => {
  const [todos, setTodos] = useState<Todo[]>([]);
  const [loading, setLoading] = useState(true);
  const [newTodoTitle, setNewTodoTitle] = useState('');
  const [aiAdvice, setAiAdvice] = useState<string | null>(null);
  const [isPlanning, setIsPlanning] = useState(false);
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
      alert('할일을 추가하는 도중 오류가 발생했습니다. 데이터베이스 연결을 확인해주세요.');
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

  const handleDayPlanner = async () => {
    if (!newTodoTitle.trim()) {
      alert('오늘의 테마나 주요 목표를 입력해주세요! AI가 하루 일과표를 짜드립니다.');
      return;
    }

    setIsPlanning(true);
    try {
      // 1. AI 일과표 생성 단계
      const schedule = await getDayPlanner(newTodoTitle);
      
      if (!schedule || schedule.length === 0) {
        alert('AI가 일과를 생성하지 못했습니다. 테마를 조금 더 구체적으로 입력해보세요.');
        setIsPlanning(false);
        return;
      }

      // 2. 데이터베이스 저장 단계
      const inserts = schedule.map(item => ({
        title: `[${item.time}] ${item.task}`,
        priority: 'medium' as Priority,
        category: 'AI Timetable'
      })).reverse();

      const { error: insertError } = await supabase.from('todos').insert(inserts);
      
      if (insertError) {
        console.error('Supabase Insert Error:', insertError);
        alert('일과표는 생성되었으나 저장하는 도중 오류가 발생했습니다.');
      } else {
        setNewTodoTitle('');
        await fetchTodos();
      }
    } catch (error) {
      console.error('Day Planner Total Error:', error);
      alert('AI 서버와의 통신 중 오류가 발생했습니다. 잠시 후 다시 시도해주세요.');
    } finally {
      setIsPlanning(false);
    }
  };

  const handleGetAdvice = async () => {
    const activeTasks = todos.filter(t => !t.is_completed).map(t => t.title);
    if (activeTasks.length === 0) {
      setAiAdvice("현재 진행 중인 할 일이 없습니다. 새로운 목표를 설정해볼까요?");
      return;
    }
    
    setIsGettingAdvice(true);
    try {
      const advice = await getPriorityAdvice(activeTasks);
      setAiAdvice(advice || "집중해서 하나씩 해결해 보세요!");
    } catch (error) {
      setAiAdvice("컨설팅을 불러오지 못했습니다.");
    } finally {
      setIsGettingAdvice(false);
    }
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
              <i className="fas fa-calendar-check scale-75"></i>
            </span>
            FocusFlow
          </h1>
          <p className="text-slate-500 font-medium">Professional AI Time Planner</p>
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
            프로 컨설팅 받기
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
        <div className="mb-10 p-6 bg-gradient-to-br from-slate-900 to-indigo-950 border border-slate-800 rounded-[1.5rem] relative overflow-hidden animate-fade-in group shadow-2xl">
          <div className="absolute top-0 right-0 p-6 opacity-5 group-hover:opacity-10 transition-opacity">
            <i className="fas fa-brain text-6xl text-white"></i>
          </div>
          <div className="relative z-10">
            <div className="flex items-center gap-3 mb-4">
              <div className="bg-indigo-500 text-white w-8 h-8 rounded-lg flex items-center justify-center shadow-lg shadow-indigo-500/20">
                <i className="fas fa-sparkles text-xs"></i>
              </div>
              <h4 className="text-xs font-black text-indigo-300 uppercase tracking-widest">Executive Productivity Coaching</h4>
              <button 
                onClick={() => setAiAdvice(null)} 
                className="ml-auto text-slate-500 hover:text-white transition-colors"
              >
                <i className="fas fa-times"></i>
              </button>
            </div>
            <div className="text-slate-200 leading-relaxed font-medium text-sm whitespace-pre-wrap">
              {aiAdvice}
            </div>
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
              placeholder="오늘의 테마나 목표를 입력하세요 (예: 자격증 공부 집중하는 날)"
              className="w-full px-6 py-5 bg-white border-2 border-slate-100 rounded-3xl focus:outline-none focus:ring-4 focus:ring-indigo-500/10 focus:border-indigo-500 transition-all text-slate-800 text-lg shadow-sm placeholder:text-slate-400"
            />
          </div>
          <div className="flex justify-between items-center px-2">
             <button 
              type="button"
              onClick={handleDayPlanner}
              disabled={isPlanning}
              className={`group text-sm font-bold flex items-center gap-2 px-6 py-3 rounded-2xl transition-all ${isPlanning ? 'bg-slate-100 text-slate-400 cursor-not-allowed' : 'bg-indigo-600 text-white hover:bg-indigo-700 shadow-lg shadow-indigo-200 active:scale-95'}`}
            >
              {isPlanning ? (
                <>
                  <i className="fas fa-circle-notch animate-spin"></i>
                  스케줄 설계 중...
                </>
              ) : (
                <>
                  <i className="fas fa-clock group-hover:rotate-12 transition-transform"></i>
                  AI 하루 일과표 생성
                </>
              )}
            </button>
            <p className="text-[11px] text-slate-400 font-medium tracking-tight">Time is your most valuable asset.</p>
          </div>
        </form>
      </section>

      {/* Todo List */}
      <section className="space-y-4">
        {loading ? (
          <div className="flex flex-col items-center justify-center py-20 opacity-40">
            <div className="w-10 h-10 border-4 border-indigo-600 border-t-transparent rounded-full animate-spin"></div>
            <p className="mt-4 font-bold text-slate-600">스케줄 로딩 중...</p>
          </div>
        ) : todos.length === 0 ? (
          <div className="text-center py-20 bg-white border-4 border-dashed border-slate-50 rounded-[2.5rem] group hover:border-indigo-50 transition-colors">
            <div className="w-20 h-20 bg-slate-50 rounded-full flex items-center justify-center mx-auto mb-6 group-hover:bg-indigo-50 transition-colors">
              <i className="fas fa-hourglass-start text-3xl text-slate-200 group-hover:text-indigo-200 transition-colors"></i>
            </div>
            <h3 className="text-slate-800 font-bold text-xl mb-2">시간표가 비어 있습니다</h3>
            <p className="text-slate-400 font-medium px-10">오늘의 테마를 입력하고 AI 일과표 버튼을 눌러보세요.</p>
          </div>
        ) : (
          <div className="space-y-1 animate-slide-up">
            <div className="flex items-center justify-between px-4 mb-4">
              <h2 className="text-sm font-black text-slate-400 uppercase tracking-[0.2em]">Timeline Feed</h2>
              <span className="text-[10px] bg-indigo-50 text-indigo-500 px-2 py-0.5 rounded-md font-bold uppercase tracking-wider">Smart Sorted</span>
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
        <p className="text-slate-300 text-[10px] font-bold tracking-widest uppercase mb-1">FocusFlow AI Timeline Edition</p>
        <p className="text-slate-400 text-xs">&copy; 2024. Optimized Daily Experience.</p>
      </footer>
    </div>
  );
};

export default App;
