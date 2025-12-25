
import React, { useState, useRef, useEffect } from 'react';
import { UserInput, ExhibitData } from './types';
import { generateExhibitData } from './geminiService';
import { LOADING_MESSAGES, STAT_LABELS, INPUT_PLACEHOLDERS } from './constants';
import { downloadAsImage } from './utils';

// Sub-component: StatsBar
const StatsBar: React.FC<{ label: string; value: number }> = ({ label, value }) => {
  const [width, setWidth] = useState(0);
  useEffect(() => {
    const timer = setTimeout(() => setWidth(value), 300);
    return () => clearTimeout(timer);
  }, [value]);

  return (
    <div className="flex flex-col gap-1.5">
      <div className="flex justify-between items-center px-1">
        <span className="text-[9px] md:text-[10px] font-bold text-gray-400 tracking-wider uppercase">{label}</span>
        <span className="text-[9px] md:text-[10px] font-bold text-gray-500">{value}%</span>
      </div>
      <div className="h-2 bg-gray-100 rounded-full overflow-hidden">
        <div 
          className="h-full bg-gradient-to-r from-[#2c5e2e] to-[#8bc34a] transition-all duration-1000 ease-out"
          style={{ width: `${width}%` }}
        />
      </div>
    </div>
  );
};

// Sub-component: Signboard
const Signboard: React.FC<{ data: ExhibitData; userName: string }> = ({ data, userName }) => (
  <div className="signboard-capture p-2 md:p-6 bg-[#fcfaf5]">
    <div className="border-[4px] md:border-[10px] border-[#3e2723] bg-white rounded-md shadow-2xl overflow-hidden">
      {/* Header */}
      <div className="bg-[#2c5e2e] text-white p-3 md:p-6 flex justify-between items-center gap-2">
        <span className="text-[9px] md:text-xs tracking-widest bg-white/10 px-2 py-0.5 md:px-3 md:py-1 rounded whitespace-nowrap overflow-hidden text-ellipsis">
          {data.classification}
        </span>
        <span className="font-extrabold text-[#ffeb3b] text-[11px] md:text-base whitespace-nowrap">
          危険度：{data.dangerLevel}
        </span>
      </div>

      {/* Body */}
      <div className="p-4 md:p-12">
        {/* Name Section */}
        <div className="border-b-2 md:border-b-4 border-gray-50 pb-3 md:pb-4 mb-4 md:mb-8">
          <h2 className="text-2xl md:text-5xl font-extrabold text-gray-900 mb-1 leading-tight break-all">
            {userName}
          </h2>
          <p className="text-[10px] md:text-lg italic text-gray-400 font-serif break-all">
            {data.scientificName}
          </p>
        </div>

        {/* Commentary Section */}
        <div className="relative bg-[#fdfdfd] border border-gray-100 p-4 md:p-8 rounded-xl md:rounded-2xl mb-6 md:mb-8">
          <span className="absolute -top-3 left-4 md:-top-3.5 md:left-6 bg-[#2c5e2e] text-white px-3 py-0.5 md:px-4 md:py-1 rounded-full font-bold text-[9px] md:text-[10px] uppercase">
            飼育員による解説
          </span>
          <p className="text-gray-700 leading-relaxed text-[12px] md:text-base whitespace-pre-wrap">
            {data.description}
          </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 md:gap-6 mb-6 md:mb-8">
          <StatsBar label={STAT_LABELS.stamina} value={data.stats.stamina} />
          <StatsBar label={STAT_LABELS.intelligence} value={data.stats.intelligence} />
          <StatsBar label={STAT_LABELS.laziness} value={data.stats.laziness} />
          <StatsBar label={STAT_LABELS.charm} value={data.stats.charm} />
        </div>

        {/* Fun Fact */}
        <div className="bg-yellow-50 rounded-xl md:rounded-2xl p-4 md:p-6 flex gap-3 md:gap-4 items-start">
          <span className="text-base md:text-xl">💡</span>
          <div>
            <strong className="text-[#ef6c00] text-xs md:text-base block mb-0.5">豆知識</strong>
            <p className="text-gray-700 text-[11px] md:text-base leading-snug">
              {data.funFact}
            </p>
          </div>
        </div>
      </div>
    </div>
  </div>
);

const App: React.FC = () => {
  const [input, setInput] = useState<UserInput>({ name: '', hobby: '', worry: '' });
  const [isLoading, setIsLoading] = useState(false);
  const [result, setResult] = useState<ExhibitData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loadingMsgIdx, setLoadingMsgIdx] = useState(0);
  const signboardRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (isLoading) {
      const interval = setInterval(() => {
        setLoadingMsgIdx(prev => (prev + 1) % LOADING_MESSAGES.length);
      }, 2500);
      return () => clearInterval(interval);
    }
  }, [isLoading]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);
    setError(null);
    setResult(null);
    try {
      const data = await generateExhibitData(input);
      setResult(data);
    } catch (err: any) {
      console.error(err);
      setError(err.message || "予期せぬエラーが発生しました。");
    } finally {
      setIsLoading(false);
    }
  };

  const handleDownload = async () => {
    if (!signboardRef.current) return;
    const btn = document.getElementById('downloadBtn');
    if (btn) btn.innerText = "🎨 書き出し中...";
    const success = await downloadAsImage(signboardRef.current, `zoo_exhibit_${Date.now()}.png`);
    if (!success) alert("画像の保存に失敗しました。スマホの場合は長押しで保存できる場合があります。");
    if (btn) btn.innerText = "🖼️ 解説看板を画像として保存";
  };

  const inputClasses = "w-full px-4 py-3 md:px-5 md:py-4 rounded-xl md:rounded-2xl border border-gray-300 bg-white text-gray-900 placeholder-gray-400 focus:border-[#2c5e2e] focus:ring-4 focus:ring-[#2c5e2e]/10 outline-none transition-all shadow-sm text-sm md:text-base";

  return (
    <div className="min-h-screen px-4 pt-12 md:pt-20 pb-12 flex flex-col items-center antialiased">
      <header className="text-center mb-10 md:mb-16 w-full max-w-2xl">
        <h1 className="text-3xl md:text-6xl font-extrabold mb-4 bg-gradient-to-r from-[#2c5e2e] to-[#558b2f] bg-clip-text text-transparent leading-tight py-1">
          もしもあなたが動物園で<br className="md:hidden" />飼育されていたら！？
        </h1>
        <p className="text-gray-400 font-bold tracking-[0.2em] text-[10px] md:text-sm uppercase">AI Official Exhibit Creator</p>
      </header>

      <main className="w-full max-w-2xl">
        {!result && !isLoading && (
          <section className="bg-white/90 backdrop-blur-md p-6 md:p-12 rounded-[32px] shadow-2xl border border-white">
            <form onSubmit={handleSubmit} className="space-y-6 md:space-y-10">
              <div className="space-y-2 md:space-y-4">
                <label className="flex items-center gap-2 font-bold text-gray-700 text-xs md:text-base">
                  <span className="text-[#8bc34a] text-lg md:text-2xl">•</span>展示名（あなたのお名前）
                </label>
                <input type="text" required placeholder={INPUT_PLACEHOLDERS.name} className={inputClasses} value={input.name} onChange={(e) => setInput({ ...input, name: e.target.value })} />
              </div>
              <div className="space-y-2 md:space-y-4">
                <label className="flex items-center gap-2 font-bold text-gray-700 text-xs md:text-base">
                  <span className="text-[#8bc34a] text-lg md:text-2xl">•</span>生態的特徴（特技・趣味・好きなもの）
                </label>
                <input type="text" required placeholder={INPUT_PLACEHOLDERS.hobby} className={inputClasses} value={input.hobby} onChange={(e) => setInput({ ...input, hobby: e.target.value })} />
              </div>
              <div className="space-y-2 md:space-y-4">
                <label className="flex items-center gap-2 font-bold text-gray-700 text-xs md:text-base">
                  <span className="text-[#8bc34a] text-lg md:text-2xl">•</span>最近観測された行動（悩み・近況）
                </label>
                <textarea required rows={3} placeholder={INPUT_PLACEHOLDERS.worry} className={inputClasses} value={input.worry} onChange={(e) => setInput({ ...input, worry: e.target.value })} />
              </div>
              <button type="submit" className="w-full py-5 md:py-6 bg-gradient-to-br from-[#2c5e2e] to-[#3a7a3d] text-white font-extrabold text-base md:text-xl rounded-2xl shadow-xl hover:-translate-y-1 active:translate-y-0 transition-transform">
                看板をデザインする
              </button>
            </form>
          </section>
        )}

        {isLoading && (
          <div className="py-20 md:py-32 flex flex-col items-center animate-pulse">
            <div className="w-16 h-16 md:w-20 md:h-20 border-4 border-[#e8f5e9] border-t-[#2c5e2e] rounded-full animate-spin mb-8 md:mb-10" />
            <p className="font-bold text-[#2c5e2e] text-lg md:text-2xl text-center px-6 leading-relaxed">
              {LOADING_MESSAGES[loadingMsgIdx]}
            </p>
          </div>
        )}

        {error && (
          <div className="bg-red-50 text-red-600 p-6 md:p-8 rounded-2xl border border-red-100 mb-10 text-center shadow-sm">
            <p className="font-bold mb-2 text-base md:text-lg">エラーが発生しました</p>
            <p className="text-sm md:text-base opacity-80">{error}</p>
          </div>
        )}

        {result && (
          <div className="space-y-8 md:space-y-12 animate-in fade-in slide-in-from-bottom-6 duration-1000">
            <div ref={signboardRef} className="rounded-2xl overflow-hidden shadow-2xl bg-[#fcfaf5]">
              <Signboard data={result} userName={input.name} />
            </div>
            <div className="space-y-4 md:space-y-6 px-2 text-center">
              <button id="downloadBtn" onClick={handleDownload} className="w-full py-5 md:py-6 bg-gradient-to-br from-[#5d4037] to-[#795548] text-white font-extrabold text-base md:text-xl rounded-2xl shadow-xl hover:-translate-y-1 active:translate-y-0 transition-transform flex items-center justify-center gap-3">
                🖼️ 解説看板を画像として保存
              </button>
              <button onClick={() => setResult(null)} className="w-full py-4 text-gray-400 font-bold text-xs md:text-base hover:text-gray-600 active:text-gray-800 transition-colors">
                別の看板を作る
              </button>
            </div>
          </div>
        )}
      </main>

      <footer className="mt-20 md:mt-32 pb-8 text-center w-full max-w-2xl border-t border-gray-200/50 pt-8">
        <p className="text-gray-400 font-medium tracking-wider text-[10px] md:text-xs italic">
          © 2024 Zoo Exhibit Creator - Powered by Gemini AI
        </p>
      </footer>
    </div>
  );
};

export default App;
