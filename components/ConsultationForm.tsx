import React, { useState } from 'react';
import { ConsultationData } from '../types';
import { Send, ArrowLeft, Check, User, Calendar, Mail, Home, Utensils, Activity, FileText } from 'lucide-react';
import { submitConsultationToGoogleSheet } from '../services/api';

// --- UI Helper Components ---

const SectionCard = ({ children, title, icon: Icon }: { children?: React.ReactNode, title: string, icon: any }) => (
    <div className="bg-white rounded-3xl shadow-soft border border-gray-100 p-6 sm:p-8 mb-8 animate-fade-in-up">
        <div className="flex items-center gap-3 mb-6 pb-4 border-b border-gray-100">
            <div className="p-2 bg-brand-50 rounded-xl text-brand-600">
                <Icon size={24} />
            </div>
            <h3 className="text-xl font-bold text-gray-800 tracking-tight">
                {title}
            </h3>
        </div>
        <div className="space-y-8">
            {children}
        </div>
    </div>
);

const Label = ({ children, required, description }: { children?: React.ReactNode, required?: boolean, description?: string }) => (
    <div className="mb-3">
        <label className="flex items-center text-sm font-bold text-gray-700">
            {children}
            {required && <span className="ml-2 px-2 py-0.5 text-[10px] bg-red-100 text-red-600 rounded-full font-extrabold tracking-wide">必須</span>}
        </label>
        {description && <p className="text-xs text-gray-400 mt-1 font-medium">{description}</p>}
    </div>
);

// Grid-based Tile Selector for Radio inputs (Excellent for Mobile)
const RadioTiles = ({ name, options, value, onChange }: { name: string, options: string[], value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }) => (
    <div className="grid grid-cols-2 gap-3">
        {options.map((option) => {
            const isSelected = value === option;
            return (
                <label 
                    key={option} 
                    className={`
                        relative flex items-center justify-center px-4 py-3.5 rounded-xl cursor-pointer transition-all duration-200 text-sm font-medium border-2
                        ${isSelected 
                            ? 'border-brand-500 bg-brand-50 text-brand-700 shadow-sm' 
                            : 'border-gray-100 bg-white text-gray-600 hover:border-gray-200 hover:bg-gray-50'
                        }
                    `}
                >
                    <input
                        type="radio"
                        name={name}
                        value={option}
                        checked={isSelected}
                        onChange={onChange}
                        className="sr-only" // Visually hide the native input
                        required
                    />
                    <span className="text-center w-full break-words leading-snug">{option}</span>
                    {isSelected && (
                        <div className="absolute top-[-8px] right-[-8px] w-5 h-5 bg-brand-500 rounded-full flex items-center justify-center border-2 border-white shadow-sm">
                            <Check size={12} className="text-white" strokeWidth={4} />
                        </div>
                    )}
                </label>
            );
        })}
    </div>
);

// List-based Checkbox Selector (Great for longer text options)
const CheckboxTiles = ({ options, selectedValues, onChange }: { options: string[], selectedValues: string[], onChange: (val: string) => void }) => (
    <div className="space-y-2">
        {options.map((option) => {
            const isSelected = selectedValues.includes(option);
            return (
                <label 
                    key={option} 
                    className={`
                        flex items-center px-5 py-4 rounded-xl cursor-pointer transition-all duration-200 border-2
                        ${isSelected 
                            ? 'border-brand-500 bg-brand-50 text-brand-900 shadow-sm' 
                            : 'border-gray-100 bg-white text-gray-600 hover:border-gray-200 hover:bg-gray-50'
                        }
                    `}
                >
                    <input
                        type="checkbox"
                        checked={isSelected}
                        onChange={() => onChange(option)}
                        className="hidden" // Visually hide
                    />
                    <div className={`
                        w-5 h-5 rounded-md border-2 mr-4 flex items-center justify-center flex-shrink-0 transition-colors
                        ${isSelected ? 'bg-brand-500 border-brand-500' : 'border-gray-300 bg-white'}
                    `}>
                        {isSelected && <Check size={14} className="text-white" strokeWidth={3} />}
                    </div>
                    <span className="font-medium text-sm sm:text-base">{option}</span>
                </label>
            );
        })}
    </div>
);

// Styled Text Input
const TextInput = ({ ...props }: React.InputHTMLAttributes<HTMLInputElement>) => (
    <input
        {...props}
        className="w-full px-5 py-3.5 rounded-xl border-2 border-gray-200 text-gray-800 placeholder-gray-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-100 outline-none transition-all duration-200 bg-gray-50 focus:bg-white text-base"
    />
);

// Styled Text Area
const TextArea = ({ ...props }: React.TextareaHTMLAttributes<HTMLTextAreaElement>) => (
    <textarea
        {...props}
        className="w-full px-5 py-3.5 rounded-xl border-2 border-gray-200 text-gray-800 placeholder-gray-400 focus:border-brand-500 focus:ring-4 focus:ring-brand-100 outline-none transition-all duration-200 bg-gray-50 focus:bg-white text-base leading-relaxed"
    />
);

interface ConsultationFormProps {
    onBack: () => void;
    onComplete: () => void;
}

export const ConsultationForm: React.FC<ConsultationFormProps> = ({ onBack, onComplete }) => {
    const [formData, setFormData] = useState<ConsultationData>({
        name: '',
        age: '',
        gender: '',
        email: '',
        livingSituation: '',
        mealCount: '',
        eatingOutFrequency: '',
        medicalHistory: '',
        symptoms: [],
        exerciseHabits: '',
        consultationPurpose: [],
        consultationExperience: '',
        content: ''
    });
    const [isSubmitting, setIsSubmitting] = useState(false);
    const [error, setError] = useState('');

    const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
        const { name, value } = e.target;
        setFormData(prev => ({ ...prev, [name]: value }));
    };

    const handleCheckboxChange = (field: 'symptoms' | 'consultationPurpose', value: string) => {
        setFormData(prev => {
            const currentArray = prev[field];
            if (currentArray.includes(value)) {
                return { ...prev, [field]: currentArray.filter(item => item !== value) };
            } else {
                return { ...prev, [field]: [...currentArray, value] };
            }
        });
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setIsSubmitting(true);

        try {
            await submitConsultationToGoogleSheet(formData);
            onComplete();
        } catch (err) {
            setError('送信に失敗しました。通信環境をご確認の上、再度お試しください。');
        } finally {
            setIsSubmitting(false);
        }
    };

    return (
        <div className="w-full max-w-2xl mx-auto">
            <div className="mb-8">
                <button 
                    onClick={onBack}
                    className="group flex items-center gap-2 text-gray-500 hover:text-brand-600 transition-colors px-4 py-2 rounded-lg hover:bg-white/50"
                >
                    <div className="p-1 rounded-full bg-white border border-gray-200 group-hover:border-brand-200 transition-colors shadow-sm">
                        <ArrowLeft size={16} />
                    </div>
                    <span className="text-sm font-bold">診断結果に戻る</span>
                </button>
            </div>

            <div className="text-center mb-10 animate-fade-in-up">
                <h2 className="text-3xl font-extrabold text-gray-800 mb-4 tracking-tight">
                    個別栄養相談<br className="sm:hidden" />申し込み
                </h2>
                <p className="text-gray-500 leading-relaxed text-sm sm:text-base max-w-lg mx-auto">
                    ヤマウチ管理栄養士が、あなたのライフスタイルに合わせた<br className="hidden sm:block"/>具体的な改善プランをご提案します。
                </p>
            </div>

            <form onSubmit={handleSubmit}>
                
                {/* Section 1: Basic Info */}
                <SectionCard title="基本情報" icon={User}>
                    <div>
                        <Label required>氏名</Label>
                        <TextInput
                            type="text"
                            name="name"
                            required
                            value={formData.name}
                            onChange={handleChange}
                            placeholder="例：山田 花子"
                        />
                    </div>

                    <div className="grid sm:grid-cols-2 gap-6">
                        <div>
                            <Label required>年齢</Label>
                            <RadioTiles
                                name="age"
                                options={['20代', '30代', '40代', '50代', '60代以上']}
                                value={formData.age}
                                onChange={handleChange}
                            />
                        </div>
                        <div>
                            <Label required>性別</Label>
                            <RadioTiles
                                name="gender"
                                options={['男性', '女性', '回答しない']}
                                value={formData.gender}
                                onChange={handleChange}
                            />
                        </div>
                    </div>

                    <div>
                        <Label required>メールアドレス</Label>
                        <TextInput
                            type="email"
                            name="email"
                            required
                            value={formData.email}
                            onChange={handleChange}
                            placeholder="例：example@email.com"
                        />
                    </div>

                    <div>
                        <Label required>居住形態</Label>
                        <RadioTiles
                            name="livingSituation"
                            options={['一人暮らし', '実家暮らし', '配偶者と同居', '子供と同居', 'シェアハウス', 'その他']}
                            value={formData.livingSituation}
                            onChange={handleChange}
                        />
                    </div>
                </SectionCard>

                {/* Section 2: Dietary Habits */}
                <SectionCard title="食生活について" icon={Utensils}>
                    <div>
                        <Label required>1日の食事回数</Label>
                        <RadioTiles
                            name="mealCount"
                            options={['1回', '2回', '3回', '4回以上']}
                            value={formData.mealCount}
                            onChange={handleChange}
                        />
                    </div>
                    <div>
                        <Label required>外食・コンビニの利用頻度</Label>
                        <RadioTiles
                            name="eatingOutFrequency"
                            options={['ほとんどなし', '週1～2回', '週3～4回', 'ほぼ毎日']}
                            value={formData.eatingOutFrequency}
                            onChange={handleChange}
                        />
                    </div>
                </SectionCard>

                {/* Section 3: Health & Lifestyle */}
                <SectionCard title="生活・健康状態" icon={Activity}>
                    <div>
                        <Label description="ある方のみご記入ください">持病や既往歴</Label>
                        <TextArea
                            name="medicalHistory"
                            rows={2}
                            value={formData.medicalHistory}
                            onChange={handleChange}
                            placeholder="特になければ空欄で構いません"
                        />
                    </div>
                    <div>
                        <Label required description="複数選択可">現在の体調や気になる症状</Label>
                        <CheckboxTiles
                            options={['特になし', '便秘', '貧血', '食欲不振', 'むくみ', '疲れやすい', 'その他']}
                            selectedValues={formData.symptoms}
                            onChange={(val) => handleCheckboxChange('symptoms', val)}
                        />
                    </div>
                    <div>
                        <Label required>運動習慣</Label>
                        <RadioTiles
                            name="exerciseHabits"
                            options={['なし', '週1～2回', '週3回以上']}
                            value={formData.exerciseHabits}
                            onChange={handleChange}
                        />
                    </div>
                </SectionCard>

                {/* Section 4: Consultation Details */}
                <SectionCard title="ご相談内容" icon={FileText}>
                    <div>
                        <Label required description="複数選択可">栄養相談を受ける目的</Label>
                        <CheckboxTiles
                            options={['ダイエット', '筋肉をつけたい', '体調改善', '食習慣を変えたい', 'その他']}
                            selectedValues={formData.consultationPurpose}
                            onChange={(val) => handleCheckboxChange('consultationPurpose', val)}
                        />
                    </div>
                    <div>
                        <Label required>栄養相談の経験</Label>
                        <RadioTiles
                            name="consultationExperience"
                            options={['初めて', '受けたことがある']}
                            value={formData.consultationExperience}
                            onChange={handleChange}
                        />
                    </div>
                    <div>
                        <Label required>詳しい相談内容</Label>
                        <TextArea
                            name="content"
                            required
                            rows={5}
                            value={formData.content}
                            onChange={handleChange}
                            placeholder="具体的な悩み、目標、好き嫌いなど、ご自由にご記入ください。"
                        />
                    </div>
                </SectionCard>

                {/* Error Message */}
                {error && (
                    <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start gap-3 text-red-700 animate-fade-in-up">
                        <div className="mt-0.5">⚠️</div>
                        <p className="text-sm font-bold leading-relaxed">{error}</p>
                    </div>
                )}

                {/* Submit Area */}
                <div className="sticky bottom-4 z-20 pb-4 px-4 sm:px-0 sm:static sm:pb-0">
                    <div className="absolute inset-0 bg-white/80 backdrop-blur-md -m-4 sm:hidden rounded-2xl shadow-lg border-t border-gray-100"></div>
                    <button
                        type="submit"
                        disabled={isSubmitting}
                        className={`
                            relative w-full py-5 rounded-2xl font-bold text-lg shadow-xl flex items-center justify-center gap-3 transition-all duration-300 text-white overflow-hidden
                            ${isSubmitting 
                                ? 'bg-gray-400 cursor-wait' 
                                : 'bg-gradient-to-r from-brand-600 to-brand-500 hover:shadow-brand-500/40 hover:-translate-y-1 active:scale-[0.98]'
                            }
                        `}
                    >
                        {isSubmitting ? (
                            <>
                                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                                <span>送信中...</span>
                            </>
                        ) : (
                            <>
                                <span>送信する</span>
                                <Send size={20} className="stroke-[2.5]" />
                            </>
                        )}
                    </button>
                </div>
                <p className="text-center text-xs text-gray-400 mt-6 mb-12">
                    ご入力いただいた情報は、栄養相談以外の目的には使用いたしません。
                </p>
            </form>
        </div>
    );
};