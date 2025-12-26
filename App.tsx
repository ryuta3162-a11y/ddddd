import React, { useState, useRef, useMemo } from 'react';
import { 
  Radar, 
  RadarChart, 
  PolarGrid, 
  PolarAngleAxis, 
  PolarRadiusAxis, 
  ResponsiveContainer 
} from 'recharts';
import { 
  Activity, 
  ArrowRight, 
  CheckCircle, 
  ChevronDown, 
  RefreshCcw, 
  Sparkles,
  ArrowLeft,
  Check,
  User,
  Mail,
  Utensils,
  FileText,
  Send
} from 'lucide-react';

// --- 設定・定数 ---
// いただいた最新のGAS WebアプリURL
const GOOGLE_SCRIPT_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxZemRhV8fb5Vk0rDvsS_UIjECST892akspCUD9ypGqFIFKo7oVJeNC2r5EFLDi5Xe9/exec";

const QUESTIONS = [
    {
        id: 1,
        title: "食事の時間は毎日決まっていますか？（朝食抜きや深夜の食事がない）",
        shortTitle: "規則性",
        options: [
            { value: 1, label: "決まっていない" },
            { value: 2, label: "ほとんど決まっていない" },
            { value: 3, label: "時々決まっている" },
            { value: 4, label: "ほとんど決まっている" },
            { value: 5, label: "決まっている" }
        ]
    },
    {
        id: 2,
        title: "毎食「主食・主菜・副菜」の3点セットを揃えていますか？",
        shortTitle: "栄養バランス",
        options: [
            { value: 1, label: "揃えていない" },
            { value: 2, label: "ほとんど揃えていない" },
            { value: 3, label: "時々揃えている" },
            { value: 4, label: "ほとんど揃えている" },
            { value: 5, label: "毎食揃えている" }
        ]
    },
    {
        id: 3,
        title: "1食に手のひら両手分（約120g）の野菜を食べていますか？",
        shortTitle: "野菜摂取",
        options: [
            { value: 1, label: "食べていない" },
            { value: 2, label: "ほとんど食べていない" },
            { value: 3, label: "時々食べている" },
            { value: 4, label: "ほとんど食べている" },
            { value: 5, label: "毎食食べている" }
        ]
    },
    {
        id: 4,
        title: "1食に手のひら片手分（約20g）のたんぱく質を食べていますか？",
        shortTitle: "たんぱく質",
        options: [
            { value: 1, label: "食べていない" },
            { value: 2, label: "ほとんど食べていない" },
            { value: 3, label: "時々食べている" },
            { value: 4, label: "ほとんど食べている" },
            { value: 5, label: "毎食食べている" }
        ]
    },
    {
        id: 5,
        title: "毎食、満腹になるまで食べず「腹八分目」で終えていますか？",
        shortTitle: "腹八分目",
        options: [
            { value: 1, label: "満腹以上食べてしまう" },
            { value: 2, label: "満腹まで食べる" },
            { value: 3, label: "時々満腹まで食べる" },
            { value: 4, label: "ほとんど終えている" },
            { value: 5, label: "終えている" }
        ]
    }
];

const ITEM_ADVICE_MAP = {
    1: "「まずは体内時計のリセットを」 食事の時間がバラバラだと、太りやすくなったり自律神経が乱れたりします。まずは「朝食を食べる」ことから始め、リズムを整えましょう。",
    2: "「定食スタイルを意識して」 丼ものや麺類だけで済ませていませんか？「主食（炭水化物）、主菜（たんぱく質）、副菜（野菜）」を揃えるだけで、代謝がスムーズになります。",
    3: "「かさを減らして賢く摂取」 生野菜だと両手分は大変ですが、加熱すればグッと小さくなります。スープや煮物にすることで、無理なく目標量をクリアしましょう。",
    4: "「筋肉と肌の源を欠かさずに」 1食でもたんぱく質が不足すると、筋肉量の減少や肌荒れの原因に。肉・魚・卵・大豆製品を毎食「片手一盛り」分、取り入れましょう。",
    5: "「あと一口、で止める勇気」 満腹まで食べると消化に負担がかかり、眠気や胃もたれの原因に。よく噛んで「もう少し食べたいな」で止めるのが、若々しさを保つコツです。"
};

// --- API 送信関数 (GAS側のheadersに完全対応) ---

const submitResultsToGoogleSheet = async (answers, freeComment) => {
    const params = new URLSearchParams();
    params.append('type', 'diagnosis');
    params.append('timestamp', new Date().toLocaleString('ja-JP'));
    
    QUESTIONS.forEach(q => {
        const val = answers[q.id];
        const label = q.options.find(o => o.value === val)?.label || '';
        params.append(`Q${q.id}_score`, val ? val.toString() : "");
        params.append(`Q${q.id}_answer`, label);
    });
    params.append('free_comment', freeComment || "");

    try {
        await fetch(GOOGLE_SCRIPT_WEB_APP_URL, {
            method: 'POST',
            mode: 'no-cors',
            body: params
        });
    } catch (e) { console.error("診断結果送信エラー:", e); }
};

const submitConsultationToGoogleSheet = async (data, answers) => {
    const params = new URLSearchParams();
    params.append('type', 'consultation');
    params.append('timestamp', new Date().toLocaleString('ja-JP'));
    
    // GAS側の headers = ["name", "age", "gender", "email", ...] に合わせる
    Object.keys(data).forEach(key => {
        const val = Array.isArray(data[key]) ? data[key].join(', ') : data[key];
        params.append(key, val || "");
    });

    // 診断回答の紐付け (GAS側の diag_Q1_score 等に合わせる)
    QUESTIONS.forEach(q => {
        const val = answers[q.id];
        params.append(`diag_Q${q.id}_score`, val ? val.toString() : "");
    });

    try {
        // no-corsモードではレスポンスを読み取れないため、成功したとみなして処理する
        await fetch(GOOGLE_SCRIPT_WEB_APP_URL, {
            method: 'POST',
            mode: 'no-cors',
            body: params
        });
    } catch (e) {
        console.error("相談フォーム送信エラー:", e);
        throw e;
    }
};

// --- 子コンポーネント ---

const QuestionCard = ({ question, selectedValue, onSelect }) => (
    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8 transition-all hover:shadow-md text-left">
        <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
            <span className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-green-500 to-green-600 text-white font-bold text-xl shadow-lg shadow-green-100">
                Q{question.id}
            </span>
            <h3 className="text-lg sm:text-xl font-bold text-gray-800 leading-tight">
                {question.title}
            </h3>
        </div>
        <div className="space-y-3">
            {question.options.map((opt) => {
                const isSelected = selectedValue === opt.value;
                return (
                    <button
                        key={opt.value}
                        onClick={() => onSelect(opt.value)}
                        className={`w-full text-left px-6 py-4 rounded-xl border-2 transition-all flex items-center justify-between group
                            ${isSelected ? 'border-green-500 bg-green-50 text-green-900' : 'border-gray-100 bg-white text-gray-600 hover:border-green-200 hover:bg-gray-50'}`}
                    >
                        <span className={`font-medium ${isSelected ? 'font-bold' : ''}`}>{opt.label}</span>
                        <div className={`w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors
                            ${isSelected ? 'border-green-500 bg-green-500' : 'border-gray-300'}`}>
                            {isSelected && <Check size={14} className="text-white" strokeWidth={4} />}
                        </div>
                    </button>
                );
            })}
        </div>
    </div>
);

const ResultChart = ({ questions, answers }) => {
    const data = questions.map(q => ({
        subject: q.shortTitle,
        A: answers[q.id] || 0,
        fullMark: 5,
    }));
    return (
        <div className="w-full aspect-square max-w-[360px] mx-auto bg-white rounded-3xl p-4 shadow-xl">
            <ResponsiveContainer width="100%" height="100%">
                <RadarChart cx="50%" cy="50%" outerRadius="60%" data={data}>
                    <PolarGrid stroke="#e5e7eb" />
                    <PolarAngleAxis dataKey="subject" tick={{ fill: '#374151', fontSize: 12, fontWeight: 700 }} />
                    <PolarRadiusAxis domain={[0, 5]} tick={false} axisLine={false} />
                    <Radar dataKey="A" stroke="#16a34a" strokeWidth={3} fill="#22c55e" fillOpacity={0.4} />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    );
};

const ConsultationForm = ({ onBack, onComplete, answers }) => {
    const [formData, setFormData] = useState({
        name: '', age: '', gender: '', email: '', livingSituation: '',
        mealCount: '', eatingOutFrequency: '', medicalHistory: '',
        symptoms: [], exerciseHabits: '', consultationPurpose: [],
        consultationExperience: '', content: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);

    const handleChange = (e) => setFormData({ ...formData, [e.target.name]: e.target.value });
    const toggleArray = (field, val) => {
        const arr = formData[field].includes(val) ? formData[field].filter(i => i !== val) : [...formData[field], val];
        setFormData({ ...formData, [field]: arr });
    };

    const handleSubmit = async (e) => {
        e.preventDefault();
        setIsSubmitting(true);
        try {
            await submitConsultationToGoogleSheet(formData, answers);
            onComplete();
        } catch (err) {
            alert('送信に失敗しました。時間をおいて再度お試しください。');
        } finally {
            setIsSubmitting(false);
        }
    };

    const Tile = ({ label, name, value, current, onChange }) => (
        <label className={`flex-1 flex items-center justify-center px-4 py-3 rounded-xl border-2 cursor-pointer transition-all text-sm font-bold
            ${current === value ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-100 bg-white text-gray-500 hover:border-green-100'}`}>
            <input type="radio" name={name} value={value} checked={current === value} onChange={onChange} className="sr-only" required />
            {label}
        </label>
    );

    return (
        <div className="max-w-2xl mx-auto">
            <button onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-green-600 mb-8 font-bold transition-colors">
                <ArrowLeft size={18} /> 診断結果に戻る
            </button>
            <h2 className="text-3xl font-black text-gray-800 text-center mb-10 tracking-tight">個別栄養相談申し込み</h2>
            <form onSubmit={handleSubmit} className="space-y-8 text-left">
                <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
                    <h3 className="text-lg font-bold flex items-center gap-2 text-green-600 border-b pb-2"><User size={20}/> 基本情報</h3>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">氏名 (必須)</label>
                        <input type="text" name="name" required value={formData.name} onChange={handleChange} className="w-full px-5 py-3 rounded-xl border-2 border-gray-100 bg-gray-50 focus:bg-white focus:border-green-500 outline-none transition-all" placeholder="例：山田 花子" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">年齢</label>
                            <div className="grid grid-cols-2 gap-2">
                                {['20代', '30代', '40代', '50代以上'].map(v => <Tile key={v} label={v} name="age" value={v} current={formData.age} onChange={handleChange} />)}
                            </div>
                        </div>
                        <div>
                            <label className="block text-sm font-bold text-gray-700 mb-2">性別</label>
                            <div className="grid grid-cols-2 gap-2">
                                {['男性', '女性'].map(v => <Tile key={v} label={v} name="gender" value={v} current={formData.gender} onChange={handleChange} />)}
                            </div>
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">メールアドレス (必須)</label>
                        <input type="email" name="email" required value={formData.email} onChange={handleChange} className="w-full px-5 py-3 rounded-xl border-2 border-gray-100 bg-gray-50 focus:bg-white focus:border-green-500 outline-none transition-all" placeholder="example@email.com" />
                    </div>
                </div>

                <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
                    <h3 className="text-lg font-bold flex items-center gap-2 text-green-600 border-b pb-2"><Utensils size={20}/> 食生活</h3>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">1日の食事回数</label>
                        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
                            {['1回', '2回', '3回', '4回以上'].map(v => <Tile key={v} label={v} name="mealCount" value={v} current={formData.mealCount} onChange={handleChange} />)}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">外食・コンビニの利用頻度</label>
                        <div className="grid grid-cols-2 gap-2">
                            {['ほとんどなし', '週1〜2回', '週3〜4回', 'ほぼ毎日'].map(v => <Tile key={v} label={v} name="eatingOutFrequency" value={v} current={formData.eatingOutFrequency} onChange={handleChange} />)}
                        </div>
                    </div>
                </div>

                <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
                    <h3 className="text-lg font-bold flex items-center gap-2 text-green-600 border-b pb-2"><FileText size={20}/> ご相談内容</h3>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">相談の目的 (複数可)</label>
                        <div className="grid grid-cols-2 gap-2">
                            {['ダイエット', '筋肉増強', '体調改善', '食習慣改善'].map(v => (
                                <button key={v} type="button" onClick={() => toggleArray('consultationPurpose', v)} className={`px-4 py-3 rounded-xl border-2 font-bold text-sm transition-all
                                    ${formData.consultationPurpose.includes(v) ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-100 text-gray-500'}`}>{v}</button>
                            ))}
                        </div>
                    </div>
                    <div>
                        <label className="block text-sm font-bold text-gray-700 mb-2">詳しい悩み (必須)</label>
                        <textarea name="content" required rows={4} value={formData.content} onChange={handleChange} className="w-full px-5 py-3 rounded-xl border-2 border-gray-100 bg-gray-50 focus:bg-white focus:border-green-500 outline-none transition-all" placeholder="現在の悩みやなりたい姿をご自由にご記入ください。"></textarea>
                    </div>
                </div>

                <button type="submit" disabled={isSubmitting} className="w-full py-5 bg-green-600 text-white rounded-2xl font-bold text-lg shadow-xl hover:bg-green-700 transition-all flex items-center justify-center gap-3">
                    {isSubmitting ? '送信中...' : '相談内容を送信する'} <Send size={20} />
                </button>
            </form>
        </div>
    );
};

// --- メインアプリ ---

const App = () => {
    const [answers, setAnswers] = useState({});
    const [freeComment, setFreeComment] = useState('');
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [showResult, setShowResult] = useState(false);
    const [showConsultation, setShowConsultation] = useState(false);
    const [consultationComplete, setConsultationComplete] = useState(false);
    const resultRef = useRef(null);

    const handleAnswer = (qid, val) => setAnswers({ ...answers, [qid]: val });
    const isComplete = QUESTIONS.every(q => answers[q.id] !== undefined);

    const diagnosis = useMemo(() => {
        if (!isComplete) return null;
        const total = Object.values(answers).reduce((a, b) => a + b, 0);
        
        let rank = 'C', main = '', sub = '';
        if (total >= 21) {
            rank = 'S'; main = "パーフェクト！"; sub = "素晴らしい食習慣です！今のリズムを維持して、理想の体をキープしましょう。";
        } else if (total >= 16) {
            rank = 'A'; main = "あと一歩！"; sub = "基本はバッチリ。あと少しの意識でさらに良くなります。伸びしろがある項目から見直してみましょう。";
        } else if (total >= 11) {
            rank = 'B'; main = "要注意…！"; sub = "生活リズムや栄養バランスに乱れが出始めています。まずは1つ、できそうな項目から改善を。";
        } else {
            rank = 'D'; main = "見直しが必要！"; sub = "体がお疲れではありませんか？将来の健康のために、少しずつ食生活を整えていく準備をしましょう。";
        }

        const advices = QUESTIONS
            .filter(q => answers[q.id] <= 2)
            .map(q => ({ title: q.shortTitle, text: ITEM_ADVICE_MAP[q.id] }));

        return { rank, main, sub, advices };
    }, [answers, isComplete]);

    const handleDiagnosis = async () => {
        setIsSubmitting(true);
        await submitResultsToGoogleSheet(answers, freeComment);
        setIsSubmitting(false);
        setShowResult(true);
        setTimeout(() => resultRef.current?.scrollIntoView({ behavior: 'smooth' }), 100);
    };

    const handleReset = () => {
        setAnswers({}); setFreeComment(''); setShowResult(false);
        setShowConsultation(false); setConsultationComplete(false);
        window.scrollTo({ top: 0, behavior: 'smooth' });
    };

    return (
        <div className="min-h-screen bg-gray-50 pb-20 font-sans text-gray-800 text-center">
            {/* ヒーローセクション */}
            <header className="bg-gradient-to-br from-green-600 to-green-800 text-white pt-16 pb-32 px-4 relative overflow-hidden text-center">
                <div className="absolute top-0 right-0 w-96 h-96 bg-white opacity-5 rounded-full transform translate-x-1/2 -translate-y-1/2 blur-3xl"></div>
                <div className="max-w-3xl mx-auto text-center relative z-10">
                    <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-5 py-2 rounded-full text-green-50 font-bold text-sm mb-8 border border-white/20 shadow-lg">
                        <Activity size={16} /> 管理栄養士監修
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black mb-8 leading-tight tracking-tight">
                        あなたの食生活、<br/><span className="text-yellow-300">足りていますか？</span>
                    </h1>
                    <p className="text-green-50 text-lg md:text-xl max-w-xl mx-auto mb-10 opacity-90 font-medium leading-relaxed">
                        5つの質問で、今のあなたの栄養バランスを「見える化」します。
                    </p>
                    {!showResult && (
                        <button onClick={() => document.getElementById('survey')?.scrollIntoView({ behavior: 'smooth' })}
                            className="bg-white text-green-700 px-10 py-4 rounded-full font-black text-lg shadow-xl hover:scale-105 transition-all">
                            診断をスタート <ChevronDown size={20} className="inline ml-1" />
                        </button>
                    )}
                </div>
            </header>

            {!showResult ? (
                <main id="survey" className="max-w-2xl mx-auto px-4 -mt-20 relative z-20 space-y-8">
                    {QUESTIONS.map(q => (
                        <QuestionCard key={q.id} question={q} selectedValue={answers[q.id]} onSelect={(v) => handleAnswer(q.id, v)} />
                    ))}
                    <div className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8 text-left">
                        <h3 className="text-lg font-bold text-gray-800 mb-4 flex items-center gap-2">
                            <span className="bg-gray-100 text-gray-500 text-[10px] px-2 py-1 rounded-md font-black">任意</span> お悩み・相談内容
                        </h3>
                        <textarea value={freeComment} onChange={(e) => setFreeComment(e.target.value)} rows={4} className="w-full p-5 border-2 border-gray-100 rounded-2xl focus:border-green-500 outline-none bg-gray-50 text-base" placeholder="例：疲れが取れにくい、肌荒れなど..." />
                    </div>
                    <div className="py-8">
                        <button onClick={handleDiagnosis} disabled={!isComplete || isSubmitting} className={`w-full py-5 rounded-2xl font-black text-xl shadow-xl flex items-center justify-center gap-3 transition-all ${!isComplete ? 'bg-gray-200 text-gray-400' : 'bg-green-600 text-white shadow-green-500/20 hover:scale-[1.02]'}`}>
                            {isSubmitting ? '診断中...' : '結果を診断する'} <CheckCircle size={24} />
                        </button>
                    </div>
                </main>
            ) : (
                <div ref={resultRef} className="bg-slate-900 text-white mt-[-4rem] pt-24 pb-20 min-h-screen">
                    <div className="max-w-4xl mx-auto px-4">
                        {!showConsultation && !consultationComplete && (
                            <>
                                <div className="text-center mb-16">
                                    <h2 className="text-green-400 font-black tracking-widest uppercase mb-3 text-sm">Diagnosis Result</h2>
                                    <p className="text-4xl font-black tracking-tight">診断結果</p>
                                </div>
                                <div className="grid md:grid-cols-2 gap-12 items-start mb-20 text-left">
                                    <ResultChart questions={QUESTIONS} answers={answers} />
                                    <div className="space-y-8">
                                        <div className="bg-white/5 backdrop-blur-md border border-white/10 rounded-3xl p-8 shadow-inner text-center">
                                            <div className="flex items-baseline justify-center gap-4 mb-4 border-b border-white/10 pb-4">
                                                <span className="text-gray-400 text-xs font-bold">評価ランク</span>
                                                <span className="text-7xl font-black text-green-400">{diagnosis.rank}</span>
                                            </div>
                                            <h3 className="text-2xl font-bold mb-3">{diagnosis.main}</h3>
                                            <p className="text-gray-300 text-sm leading-relaxed font-medium">{diagnosis.sub}</p>
                                        </div>

                                        {diagnosis.advices.length > 0 && (
                                            <div className="space-y-4">
                                                <h4 className="font-bold text-yellow-300 flex items-center gap-2 text-lg">
                                                    <Sparkles size={20} /> 栄養バランスの改善アドバイス
                                                </h4>
                                                <div className="space-y-3">
                                                    {diagnosis.advices.map((adv, idx) => (
                                                        <div key={idx} className="bg-green-900/40 border border-green-500/30 rounded-2xl p-5">
                                                            <p className="text-yellow-200 font-black text-sm mb-2">{adv.title}</p>
                                                            <p className="text-gray-100 text-xs leading-relaxed font-medium">{adv.text}</p>
                                                        </div>
                                                    ))}
                                                </div>
                                            </div>
                                        )}

                                        <button onClick={() => setShowConsultation(true)} className="w-full bg-green-500 hover:bg-green-400 text-white py-5 rounded-2xl font-bold text-lg shadow-lg flex items-center justify-center gap-3 transition-all hover:scale-105 active:scale-95 text-center">
                                            管理栄養士に詳しく相談する <ArrowRight size={20} />
                                        </button>
                                    </div>
                                </div>
                                <div className="text-center"><button onClick={handleReset} className="text-gray-500 hover:text-white transition-colors flex items-center gap-2 mx-auto px-6 py-3 font-bold"><RefreshCcw size={16} /> もう一度診断する</button></div>
                            </>
                        )}

                        {showConsultation && !consultationComplete && (
                            <div className="bg-gray-50 rounded-[3rem] shadow-2xl p-6 sm:p-12 text-gray-800">
                                <ConsultationForm onBack={() => setShowConsultation(false)} onComplete={() => setConsultationComplete(true)} answers={answers} />
                            </div>
                        )}

                        {consultationComplete && (
                            <div className="bg-white text-gray-800 rounded-[3rem] shadow-2xl p-16 text-center max-w-lg mx-auto flex flex-col items-center">
                                <div className="w-24 h-24 bg-green-100 text-green-600 rounded-full flex items-center justify-center mb-8 shadow-inner animate-bounce"><CheckCircle size={48} strokeWidth={3} /></div>
                                <h2 className="text-3xl font-black mb-4 text-center">送信完了</h2>
                                <p className="text-gray-500 mb-12 font-bold leading-relaxed text-lg text-center">ご回答ありがとうございました。<br/>担当者より折り返しご連絡いたします。</p>
                                <button onClick={handleReset} className="bg-gray-900 text-white px-12 py-4 rounded-full font-black text-lg shadow-xl hover:scale-105 transition-all">トップに戻る</button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;