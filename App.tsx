import React, { useState, useRef, useMemo, useEffect } from 'react';
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
  Send,
  Home,
  Heart,
  Clock
} from 'lucide-react';

// --- 設定・定数 ---
const GOOGLE_SCRIPT_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxZemRhV8fb5Vk0rDvsS_UIjECST892akspCUD9ypGqFIFKo7oVJeNC2r5EFLDi5Xe9/exec";

const QUESTIONS = [
    { id: 1, title: "食事の時間は毎日決まっていますか？", shortTitle: "規則性", options: [{ value: 1, label: "決まっていない" }, { value: 2, label: "ほとんど決まっていない" }, { value: 3, label: "時々決まっている" }, { value: 4, label: "ほとんど決まっている" }, { value: 5, label: "決まっている" }] },
    { id: 2, title: "毎食「主食・主菜・副菜」を揃えていますか？", shortTitle: "バランス", options: [{ value: 1, label: "揃えていない" }, { value: 2, label: "ほとんど揃えていない" }, { value: 3, label: "時々揃えている" }, { value: 4, label: "ほとんど揃えている" }, { value: 5, label: "毎食揃えている" }] },
    { id: 3, title: "1食に野菜を手のひら両手分食べていますか？", shortTitle: "野菜摂取", options: [{ value: 1, label: "食べていない" }, { value: 2, label: "ほとんど食べていない" }, { value: 3, label: "時々食べている" }, { value: 4, label: "ほとんど食べている" }, { value: 5, label: "毎食食べている" }] },
    { id: 4, title: "1食にたんぱく質を片手分食べていますか？", shortTitle: "たんぱく質", options: [{ value: 1, label: "食べていない" }, { value: 2, label: "ほとんど食べていない" }, { value: 3, label: "時々食べている" }, { value: 4, label: "ほとんど食べている" }, { value: 5, label: "毎食食べている" }] },
    { id: 5, title: "毎食、腹八分目で終えていますか？", shortTitle: "腹八分目", options: [{ value: 1, label: "満腹以上" }, { value: 2, label: "満腹まで" }, { value: 3, label: "時々満腹" }, { value: 4, label: "ほとんど終えている" }, { value: 5, label: "終えている" }] }
];

const ITEM_ADVICE_MAP = {
    1: "「まずは体内時計のリセットを」 食事の時間がバラバラだと、太りやすくなったり自律神経が乱れたりします。",
    2: "「定食スタイルを意識して」 丼ものや麺類だけで済ませず、副菜（野菜）を揃えるだけで代謝がスムーズになります。",
    3: "「かさを減らして賢く摂取」 生野菜だと大変ですが、加熱すれば小さくなります。スープ等で目標量をクリアしましょう。",
    4: "「筋肉と肌の源を欠かさずに」 肉・魚・卵・大豆製品を毎食「片手一盛り」分、取り入れましょう。",
    5: "「あと一口、で止める勇気」 満腹まで食べると消化に負担がかかります。よく噛んで若々しさを保ちましょう。"
};

// --- API 送信関数 ---
const submitResultsToGoogleSheet = async (answers, freeComment) => {
    const params = new URLSearchParams();
    params.append('type', 'diagnosis');
    QUESTIONS.forEach(q => {
        const val = answers[q.id];
        params.append(`Q${q.id}_score`, val ? val.toString() : "");
        params.append(`Q${q.id}_answer`, q.options.find(o => o.value === val)?.label || '');
    });
    params.append('free_comment', freeComment || "");
    try { await fetch(GOOGLE_SCRIPT_WEB_APP_URL, { method: 'POST', mode: 'no-cors', body: params }); } catch (e) { console.error(e); }
};

const submitConsultationToGoogleSheet = async (data, answers) => {
    const params = new URLSearchParams();
    params.append('type', 'consultation');
    Object.keys(data).forEach(key => {
        const val = Array.isArray(data[key]) ? data[key].join(', ') : data[key];
        params.append(key, val || "");
    });
    // 診断回答の紐付け
    QUESTIONS.forEach(q => params.append(`diag_Q${q.id}_score`, answers[q.id]?.toString() || ""));

    try { await fetch(GOOGLE_SCRIPT_WEB_APP_URL, { method: 'POST', mode: 'no-cors', body: params }); } 
    catch (e) { console.error(e); throw e; }
};

// --- 子コンポーネント ---

const ConsultationForm = ({ onBack, onComplete, answers }) => {
    const [formData, setFormData] = useState({
        name: '', age: '', gender: '', email: '', livingSituation: '',
        mealCount: '', eatingOutFrequency: '', medicalHistory: '',
        symptoms: [], exerciseHabits: '', consultationPurpose: [],
        consultationExperience: '', content: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const formRef = useRef(null);

    // フォームが表示された時に上部にスクロール
    useEffect(() => { formRef.current?.scrollIntoView({ behavior: 'smooth' }); }, []);

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
            alert('送信に失敗しました。');
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
        <div ref={formRef} className="max-w-2xl mx-auto pt-10">
            <button type="button" onClick={onBack} className="flex items-center gap-2 text-gray-500 hover:text-green-600 mb-8 font-bold">
                <ArrowLeft size={18} /> 診断結果に戻る
            </button>
            <h2 className="text-3xl font-black text-gray-800 text-center mb-10">個別栄養相談申し込み</h2>
            <form onSubmit={handleSubmit} className="space-y-8 text-left">
                {/* 基本情報 */}
                <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
                    <h3 className="text-lg font-bold flex items-center gap-2 text-green-600 border-b pb-2"><User size={20}/> 基本情報</h3>
                    <div><label className="block text-sm font-bold text-gray-700 mb-2">氏名 (必須)</label>
                        <input type="text" name="name" required value={formData.name} onChange={handleChange} className="w-full px-5 py-3 rounded-xl border-2 border-gray-100 bg-gray-50 focus:border-green-500 outline-none transition-all" placeholder="例：山田 花子" />
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div><label className="block text-sm font-bold text-gray-700 mb-2">年齢 (必須)</label>
                            <div className="grid grid-cols-2 gap-2">{['20代', '30代', '40代', '50代以上'].map(v => <Tile key={v} label={v} name="age" value={v} current={formData.age} onChange={handleChange} />)}</div>
                        </div>
                        <div><label className="block text-sm font-bold text-gray-700 mb-2">性別 (必須)</label>
                            <div className="grid grid-cols-2 gap-2">{['男性', '女性'].map(v => <Tile key={v} label={v} name="gender" value={v} current={formData.gender} onChange={handleChange} />)}</div>
                        </div>
                    </div>
                    <div><label className="block text-sm font-bold text-gray-700 mb-2">メールアドレス (必須)</label>
                        <input type="email" name="email" required value={formData.email} onChange={handleChange} className="w-full px-5 py-3 rounded-xl border-2 border-gray-100 bg-gray-50 focus:border-green-500 outline-none transition-all" placeholder="example@email.com" />
                    </div>
                </div>

                {/* 食生活 */}
                <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
                    <h3 className="text-lg font-bold flex items-center gap-2 text-green-600 border-b pb-2"><Utensils size={20}/> 食生活</h3>
                    <div><label className="block text-sm font-bold text-gray-700 mb-2">居住形態 (必須)</label>
                        <div className="grid grid-cols-2 gap-2">{['一人暮らし', '家族と同居'].map(v => <Tile key={v} label={v} name="livingSituation" value={v} current={formData.livingSituation} onChange={handleChange} />)}</div>
                    </div>
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
                        <div><label className="block text-sm font-bold text-gray-700 mb-2">1日の食事回数</label>
                            <div className="grid grid-cols-2 gap-2">{['1回', '2回', '3回', '4回以上'].map(v => <Tile key={v} label={v} name="mealCount" value={v} current={formData.mealCount} onChange={handleChange} />)}</div>
                        </div>
                        <div><label className="block text-sm font-bold text-gray-700 mb-2">外食頻度</label>
                            <div className="grid grid-cols-2 gap-2">{['ほぼなし', '週1〜3回', '週4以上', 'ほぼ毎日'].map(v => <Tile key={v} label={v} name="eatingOutFrequency" value={v} current={formData.eatingOutFrequency} onChange={handleChange} />)}</div>
                        </div>
                    </div>
                </div>

                {/* ご相談内容 */}
                <div className="bg-white p-6 sm:p-8 rounded-3xl shadow-sm border border-gray-100 space-y-6">
                    <h3 className="text-lg font-bold flex items-center gap-2 text-green-600 border-b pb-2"><FileText size={20}/> ご相談内容</h3>
                    <div><label className="block text-sm font-bold text-gray-700 mb-2">相談の目的 (必須・複数可)</label>
                        <div className="grid grid-cols-2 gap-2">{['ダイエット', '筋肉増強', '体調改善', '食習慣改善'].map(v => (
                            <button key={v} type="button" onClick={() => toggleArray('consultationPurpose', v)} className={`px-4 py-3 rounded-xl border-2 font-bold text-sm transition-all ${formData.consultationPurpose.includes(v) ? 'border-green-500 bg-green-50 text-green-700' : 'border-gray-100 text-gray-500'}`}>{v}</button>
                        ))}</div>
                    </div>
                    <div><label className="block text-sm font-bold text-gray-700 mb-2">詳しい悩み (必須)</label>
                        <textarea name="content" required rows={4} value={formData.content} onChange={handleChange} className="w-full px-5 py-3 rounded-xl border-2 border-gray-100 bg-gray-50 focus:border-green-500 outline-none transition-all" placeholder="現在の悩みやなりたい姿をご自由にご記入ください。"></textarea>
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
        if (total >= 21) { rank = 'S'; main = "パーフェクト！"; sub = "素晴らしい食習慣です！今のリズムを維持して、理想の体をキープしましょう。"; }
        else if (total >= 16) { rank = 'A'; main = "あと一歩！"; sub = "基本はバッチリ。あと少しの意識でさらに良くなります。伸びしろがある項目から見直してみましょう。"; }
        else if (total >= 11) { rank = 'B'; main = "要注意…！"; sub = "生活リズムや栄養バランスに乱れが出始めています。まずは1つ、できそうな項目から改善を。"; }
        else { rank = 'D'; main = "見直しが必要！"; sub = "体がお疲れではありませんか？将来の健康のために、少しずつ食生活を整えていく準備をしましょう。"; }
        const advices = QUESTIONS.filter(q => answers[q.id] <= 2).map(q => ({ title: q.shortTitle, text: ITEM_ADVICE_MAP[q.id] }));
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
        <div className="min-h-screen bg-gray-50 pb-20 font-sans text-gray-800 text-center selection:bg-green-100">
            <header className="bg-gradient-to-br from-green-600 to-green-800 text-white pt-16 pb-32 px-4 relative overflow-hidden">
                <div className="max-w-3xl mx-auto text-center relative z-10">
                    <div className="inline-flex items-center gap-2 bg-white/10 backdrop-blur-md px-5 py-2 rounded-full text-green-50 font-bold text-sm mb-8 border border-white/20">
                        <Activity size={16} /> 管理栄養士監修
                    </div>
                    <h1 className="text-4xl md:text-6xl font-black mb-8 leading-tight">あなたの食生活、<br/><span className="text-yellow-300">足りていますか？</span></h1>
                    {!showResult && (
                        <button onClick={() => document.getElementById('survey')?.scrollIntoView({ behavior: 'smooth' })}
                            className="bg-white text-green-700 px-10 py-4 rounded-full font-black text-lg shadow-xl hover:scale-105 transition-all">
                            診断をスタート <ChevronDown size={20} className="inline ml-1" />
                        </button>
                    )}
                </div>
            </header>

            {!showResult ? (
                <main id="survey" className="max-w-2xl mx-auto px-4 -mt-20 relative z-20 space-y-8 text-left">
                    {QUESTIONS.map(q => (
                        <div key={q.id} className="bg-white rounded-3xl shadow-sm border border-gray-100 p-6 sm:p-8">
                            <div className="flex gap-4 mb-6 items-center">
                                <span className="w-10 h-10 bg-green-500 text-white rounded-xl flex items-center justify-center font-bold">Q{q.id}</span>
                                <h3 className="font-bold text-lg">{q.title}</h3>
                            </div>
                            <div className="space-y-2">
                                {q.options.map(o => (
                                    <button key={o.value} onClick={() => handleAnswer(q.id, o.value)} className={`w-full text-left p-4 rounded-xl border-2 transition-all flex justify-between items-center ${answers[q.id] === o.value ? 'border-green-500 bg-green-50' : 'border-gray-50 bg-gray-50 hover:border-green-200'}`}>
                                        {o.label} {answers[q.id] === o.value && <Check size={16} className="text-green-600" />}
                                    </button>
                                ))}
                            </div>
                        </div>
                    ))}
                    <button onClick={handleDiagnosis} disabled={!isComplete || isSubmitting} className="w-full py-5 bg-green-600 text-white rounded-2xl font-black text-xl shadow-xl disabled:bg-gray-300">診断する</button>
                </main>
            ) : (
                <div ref={resultRef} className="bg-slate-900 text-white mt-[-4rem] pt-24 pb-20 min-h-screen">
                    <div className="max-w-4xl mx-auto px-4">
                        {!showConsultation && !consultationComplete ? (
                            <div className="space-y-12">
                                <div className="text-center"><h2 className="text-4xl font-black mb-4">診断結果</h2></div>
                                <div className="grid md:grid-cols-2 gap-12 text-left">
                                    <ResultChart questions={QUESTIONS} answers={answers} />
                                    <div className="space-y-6">
                                        <div className="bg-white/5 p-8 rounded-3xl border border-white/10 text-center">
                                            <span className="text-7xl font-black text-green-400">{diagnosis.rank}</span>
                                            <h3 className="text-2xl font-bold mt-4">{diagnosis.main}</h3>
                                            <p className="text-gray-400 text-sm mt-2">{diagnosis.sub}</p>
                                        </div>
                                        {diagnosis.advices.map((adv, i) => (
                                            <div key={i} className="bg-green-900/30 p-4 rounded-2xl border border-green-500/20">
                                                <p className="text-yellow-300 font-bold text-sm mb-1">{adv.title}</p>
                                                <p className="text-gray-300 text-xs">{adv.text}</p>
                                            </div>
                                        ))}
                                        <button onClick={() => setShowConsultation(true)} className="w-full py-5 bg-green-600 text-white rounded-2xl font-bold text-lg">専門家に詳しく相談する</button>
                                    </div>
                                </div>
                                <button onClick={handleReset} className="text-gray-500 font-bold">もう一度診断する</button>
                            </div>
                        ) : showConsultation && !consultationComplete ? (
                            <div className="bg-gray-50 rounded-[3rem] p-6 sm:p-12 text-gray-800">
                                <ConsultationForm onBack={() => setShowConsultation(false)} onComplete={() => { setConsultationComplete(true); window.scrollTo({ top: 0, behavior: 'smooth' }); }} answers={answers} />
                            </div>
                        ) : (
                            <div className="bg-white text-gray-800 rounded-[3rem] p-16 flex flex-col items-center">
                                <CheckCircle size={64} className="text-green-500 mb-6" />
                                <h2 className="text-3xl font-black mb-4">送信完了</h2>
                                <p className="text-gray-500 mb-8 font-bold">ご回答ありがとうございました。</p>
                                <button onClick={handleReset} className="bg-gray-900 text-white px-12 py-4 rounded-full font-bold">トップに戻る</button>
                            </div>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
};

export default App;