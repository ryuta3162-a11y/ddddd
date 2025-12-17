import React, { useState, useRef, useEffect } from 'react';
import { QUESTIONS } from './constants';
import { Answers } from './types';
import { QuestionCard } from './components/QuestionCard';
import { ResultChart } from './components/ResultChart';
import { ConsultationForm } from './components/ConsultationForm';
import { submitResultsToGoogleSheet } from './services/api';
import { Activity, ArrowRight, CheckCircle, ChevronDown, RefreshCcw, Sparkles } from 'lucide-react';

const App: React.FC = () => {
    const [answers, setAnswers] = useState<Answers>({});
    const [freeComment, setFreeComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showResult, setShowResult] = useState(false);
    const [showConsultation, setShowConsultation] = useState(false);
    const [consultationComplete, setConsultationComplete] = useState(false);
    
    const resultRef = useRef<HTMLDivElement>(null);
    const consultationRef = useRef<HTMLDivElement>(null);

    const handleAnswer = (questionId: number, value: number) => {
        setAnswers(prev => ({ ...prev, [questionId]: value }));
    };

    const isComplete = QUESTIONS.every(q => answers[q.id] !== undefined);

    const calculateResult = () => {
        const scores = Object.values(answers) as number[];
        const total = scores.reduce((a, b) => a + b, 0);
        
        // Find weakest point (lowest score)
        let minScore = 6;
        let weakPointId = 0;
        
        QUESTIONS.forEach(q => {
            const score = answers[q.id];
            if (score !== undefined && score < minScore) {
                minScore = score;
                weakPointId = q.id;
            }
        });

        const weakQuestion = QUESTIONS.find(q => q.id === weakPointId);
        
        let rank = 'B';
        let mainText = "改善の余地あり";
        let subText = "食生活が乱れている可能性があります。今のままでは体調や集中力に影響が出るかもしれません。できることから一つずつ始めましょう。";

        if (total >= 22) {
            rank = 'S';
            mainText = "素晴らしい！";
            subText = "非常に優秀な食生活です！この調子で現在の習慣を維持しましょう。微調整を行うだけで、さらに健康的な体を手に入れられます。";
        } else if (total >= 15) {
            rank = 'A';
            mainText = "あともう少し！";
            subText = "基本的な意識はできています。あと少し改善すれば完璧です。苦手な部分を意識的にカバーしてみましょう。";
        }

        return { total, rank, mainText, subText, weakPointShort: weakQuestion?.shortTitle };
    };

    const handleSubmit = async () => {
        if (!isComplete) return;
        
        setIsSubmitting(true);
        
        // Submit diagnosis data to GAS in the background
        await submitResultsToGoogleSheet(answers, freeComment);

        setIsSubmitting(false);
        setShowResult(true);
        
        // Scroll to results
        setTimeout(() => {
            resultRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const handleReset = () => {
        setAnswers({});
        setFreeComment('');
        setShowResult(false);
        setShowConsultation(false);
        setConsultationComplete(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    const handleStartConsultation = () => {
        setShowConsultation(true);
        setTimeout(() => {
            consultationRef.current?.scrollIntoView({ behavior: 'smooth' });
        }, 100);
    };

    const result = calculateResult();

    return (
        <div className="min-h-screen pb-20">
            {/* Hero Header */}
            <div className="bg-gradient-to-br from-brand-500 to-brand-700 text-white pt-16 pb-28 px-4 relative overflow-hidden">
                {/* Abstract Shapes for Professional Look */}
                <div className="absolute top-0 right-0 w-80 h-80 bg-white opacity-5 rounded-full transform translate-x-1/2 -translate-y-1/2 blur-3xl animate-pulse"></div>
                <div className="absolute bottom-0 left-0 w-96 h-96 bg-yellow-300 opacity-10 rounded-full transform -translate-x-1/3 translate-y-1/3 blur-3xl"></div>
                
                <div className="max-w-3xl mx-auto text-center relative z-10 animate-fade-in-up">
                    <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-5 py-2 rounded-full text-brand-50 font-semibold text-sm mb-8 border border-white/20 shadow-lg">
                        <Activity size={16} />
                        <span>無料・登録不要</span>
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black mb-8 tracking-tight leading-tight drop-shadow-sm">
                        あなたの食生活、<br className="md:hidden"/>本当に<span className="text-transparent bg-clip-text bg-gradient-to-r from-yellow-200 to-yellow-400">足りていますか？</span>
                    </h1>
                    <p className="text-brand-50 text-lg md:text-xl max-w-xl mx-auto leading-relaxed mb-10 font-medium opacity-90">
                        たった5つの質問に答えるだけで、今のあなたの栄養バランス状態を「見える化」します。プロの診断ロジックで現状を知りましょう。
                    </p>
                    <button 
                        onClick={() => document.getElementById('survey-start')?.scrollIntoView({ behavior: 'smooth' })}
                        className="bg-white text-brand-700 px-10 py-4 rounded-full font-bold text-lg shadow-xl hover:shadow-2xl hover:scale-105 transition-all duration-300 flex items-center gap-2 mx-auto"
                    >
                        診断をスタート <ChevronDown size={20} className="stroke-[3]" />
                    </button>
                </div>
            </div>

            {/* Main Content Area */}
            {!showResult ? (
                <main id="survey-start" className="max-w-2xl mx-auto px-4 -mt-20 relative z-20 space-y-8">
                    {/* Questions */}
                    <div className="space-y-6">
                        {QUESTIONS.map((q) => (
                            <div key={q.id} className="animate-fade-in-up" style={{ animationDelay: `${q.id * 100}ms` }}>
                                <QuestionCard 
                                    question={q}
                                    selectedValue={answers[q.id]}
                                    onSelect={(val) => handleAnswer(q.id, val)}
                                />
                            </div>
                        ))}
                    </div>

                    {/* Free Comment Section */}
                    <div className="bg-white rounded-3xl shadow-soft border border-gray-100 p-6 sm:p-8 animate-fade-in-up" style={{ animationDelay: '600ms' }}>
                         <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-3">
                            <span className="bg-gray-100 text-gray-500 text-xs px-2.5 py-1 rounded-md font-bold">任意</span>
                            その他、食生活のお悩み
                        </h3>
                        <textarea 
                            value={freeComment}
                            onChange={(e) => setFreeComment(e.target.value)}
                            rows={4} 
                            className="w-full p-5 border-2 border-gray-100 rounded-2xl focus:ring-4 focus:ring-brand-100 focus:border-brand-500 outline-none transition duration-200 bg-gray-50 placeholder-gray-400 text-base" 
                            placeholder="例：最近疲れが取れにくい、肌荒れが気になる、具体的な改善レシピが知りたい..."
                        ></textarea>
                    </div>

                    {/* Submit Button */}
                    <div className="py-8 pb-20">
                        <button 
                            onClick={handleSubmit}
                            disabled={!isComplete || isSubmitting}
                            className={`w-full py-5 rounded-2xl font-bold text-xl shadow-xl flex items-center justify-center gap-3 transition-all duration-300 transform
                                ${!isComplete 
                                    ? 'bg-gray-200 text-gray-400 cursor-not-allowed' 
                                    : 'bg-gradient-to-r from-brand-600 to-brand-500 text-white hover:shadow-brand-500/40 hover:-translate-y-1 active:scale-[0.98]'
                                }`}
                        >
                            {isSubmitting ? '診断中...' : '結果を診断する'}
                            {!isSubmitting && <CheckCircle size={24} className="stroke-[2.5]" />}
                        </button>
                        {!isComplete && (
                            <p className="text-center text-red-500 mt-4 text-sm font-bold bg-red-50 py-2 rounded-lg inline-block w-full animate-pulse">
                                すべての質問にお答えください
                            </p>
                        )}
                    </div>
                </main>
            ) : (
                /* Results Section */
                <div ref={resultRef} className="bg-slate-900 text-white mt-[-4rem] pt-24 pb-20 relative overflow-hidden min-h-screen">
                    <div className="absolute top-0 left-0 w-full h-full opacity-30 bg-[radial-gradient(ellipse_at_top,_var(--tw-gradient-stops))] from-brand-900 via-slate-900 to-slate-900 pointer-events-none"></div>

                    <div className="max-w-4xl mx-auto px-4 relative z-10">
                        
                        {/* If Consultation is NOT active, show results */}
                        {!showConsultation && !consultationComplete && (
                            <>
                                <div className="text-center mb-16 animate-fade-in-up">
                                    <h2 className="text-brand-400 font-bold tracking-widest uppercase mb-3 text-sm">Diagnosis Result</h2>
                                    <p className="text-3xl md:text-4xl font-bold drop-shadow-md">あなたの栄養バランス診断結果</p>
                                </div>

                                <div className="grid md:grid-cols-2 gap-12 items-center mb-16 animate-fade-in-up">
                                    {/* Chart Section - Fixed Width Container */}
                                    <div className="flex justify-center relative w-full">
                                        <div className="absolute inset-0 bg-brand-500 blur-[60px] opacity-20 rounded-full"></div>
                                        <div className="relative z-10 w-full max-w-sm">
                                            <ResultChart questions={QUESTIONS} answers={answers} />
                                        </div>
                                    </div>

                                    <div className="space-y-8">
                                        <div className="bg-white/5 backdrop-blur-sm border border-white/10 rounded-2xl p-6">
                                            <div className="flex items-baseline gap-4 mb-4 border-b border-white/10 pb-4">
                                                <span className="text-gray-400 text-lg font-medium">総合評価ランク</span>
                                                <span className="text-6xl font-black text-transparent bg-clip-text bg-gradient-to-r from-brand-300 to-brand-500 drop-shadow-lg">
                                                    {result.rank}
                                                </span>
                                            </div>
                                            <h3 className="text-2xl font-bold mb-3">{result.mainText}</h3>
                                            <p className="text-gray-300 leading-relaxed text-sm">
                                                {result.subText}
                                            </p>
                                        </div>

                                        <div className="bg-brand-900/40 border border-brand-500/30 rounded-2xl p-6">
                                            <h4 className="font-bold text-yellow-300 mb-3 flex items-center gap-2">
                                                <Sparkles size={18} /> {result.weakPointShort}へのアドバイス
                                            </h4>
                                            <p className="text-gray-300 text-sm leading-relaxed">
                                                特にこの項目のスコアが低めでした。
                                                ここを改善することで、体調やパフォーマンスの向上が期待できます。
                                                無理なく続けられる小さな習慣から始めてみましょう。
                                            </p>
                                        </div>

                                        <div className="space-y-4 pt-6">
                                            <button 
                                                onClick={handleStartConsultation}
                                                className="w-full text-center bg-gradient-to-r from-brand-500 to-brand-400 hover:from-brand-400 hover:to-brand-300 text-white py-5 rounded-2xl font-bold text-lg shadow-lg hover:shadow-brand-500/30 transition-all duration-300 flex items-center justify-center gap-3 group border border-white/10"
                                            >
                                                管理栄養士に詳しく相談する
                                                <ArrowRight size={20} className="group-hover:translate-x-1 transition-transform" />
                                            </button>
                                            <p className="text-center text-xs text-gray-500">
                                                ※相談は無料です。個別のアドバイスをご提案します。
                                            </p>
                                        </div>
                                    </div>
                                </div>
                                
                                <div className="text-center animate-fade-in-up delay-200">
                                    <button 
                                        onClick={handleReset}
                                        className="text-gray-500 hover:text-white transition-colors flex items-center gap-2 mx-auto px-6 py-3 rounded-full hover:bg-white/5"
                                    >
                                        <RefreshCcw size={16} />
                                        もう一度診断する
                                    </button>
                                </div>
                            </>
                        )}

                        {/* Consultation Form View (Embeds in a nice card container) */}
                        {showConsultation && !consultationComplete && (
                            <div ref={consultationRef} className="max-w-2xl mx-auto bg-gray-50 rounded-[2.5rem] shadow-2xl overflow-hidden p-6 sm:p-10 text-left text-gray-800 animate-scale-in">
                                <ConsultationForm 
                                    onBack={() => setShowConsultation(false)} 
                                    onComplete={() => setConsultationComplete(true)} 
                                />
                            </div>
                        )}

                        {/* Consultation Complete View */}
                        {consultationComplete && (
                             <div className="bg-white text-gray-800 rounded-[2.5rem] shadow-2xl p-10 md:p-16 text-center max-w-lg mx-auto animate-scale-in flex flex-col items-center justify-center min-h-[400px]">
                                <div className="w-24 h-24 bg-gradient-to-br from-brand-100 to-brand-200 text-brand-600 rounded-full flex items-center justify-center mb-8 shadow-inner animate-bounce">
                                    <CheckCircle size={48} className="stroke-[3]" />
                                </div>
                                <h2 className="text-2xl md:text-3xl font-black mb-4 tracking-tight">送信完了</h2>
                                <p className="text-gray-500 mb-10 leading-relaxed font-medium">
                                    ご回答いただきありがとうございました。
                                </p>
                                <button 
                                    onClick={handleReset}
                                    className="bg-gray-900 hover:bg-black text-white px-10 py-4 rounded-full font-bold transition-all hover:scale-105 shadow-xl"
                                >
                                    トップに戻る
                                </button>
                             </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;