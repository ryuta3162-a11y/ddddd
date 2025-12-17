import React from 'react';
import { Question } from '../types';

interface QuestionCardProps {
    question: Question;
    selectedValue?: number;
    onSelect: (value: number) => void;
}

export const QuestionCard: React.FC<QuestionCardProps> = ({ question, selectedValue, onSelect }) => {
    return (
        <div className="bg-white rounded-3xl shadow-soft border border-gray-100 p-6 sm:p-8 transition-transform duration-300 hover:translate-y-[-2px]">
            <div className="flex flex-col sm:flex-row sm:items-center gap-4 mb-8">
                <span className="flex-shrink-0 flex items-center justify-center w-12 h-12 rounded-2xl bg-gradient-to-br from-brand-400 to-brand-600 text-white font-bold text-xl shadow-glow">
                    Q{question.id}
                </span>
                <h3 className="text-lg sm:text-xl font-bold text-gray-800 leading-relaxed tracking-tight">
                    {question.title}
                </h3>
            </div>

            <div className="space-y-3">
                {question.options.map((option) => {
                    const isSelected = selectedValue === option.value;
                    return (
                        <button
                            key={option.value}
                            type="button"
                            onClick={() => onSelect(option.value)}
                            className={`w-full text-left px-6 py-4 rounded-xl border-2 transition-all duration-200 flex items-center justify-between group relative overflow-hidden
                                ${isSelected 
                                    ? 'border-brand-500 bg-brand-50 text-brand-900 shadow-sm' 
                                    : 'border-gray-100 bg-white text-gray-600 hover:border-brand-200 hover:bg-gray-50'
                                }`}
                        >
                            <span className={`relative z-10 font-medium transition-all ${isSelected ? 'font-bold pl-1' : ''}`}>
                                {option.label}
                            </span>
                            
                            <div className={`relative z-10 w-6 h-6 rounded-full border-2 flex items-center justify-center transition-colors
                                ${isSelected ? 'border-brand-500 bg-brand-500' : 'border-gray-300 group-hover:border-brand-300'}`}>
                                <svg 
                                    className={`w-3.5 h-3.5 text-white transition-transform duration-200 ${isSelected ? 'scale-100' : 'scale-0'}`} 
                                    fill="none" 
                                    viewBox="0 0 24 24" 
                                    stroke="currentColor" 
                                    strokeWidth="3"
                                >
                                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                                </svg>
                            </div>
                        </button>
                    );
                })}
            </div>
        </div>
    );
};