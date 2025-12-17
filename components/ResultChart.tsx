import React from 'react';
import { Radar, RadarChart, PolarGrid, PolarAngleAxis, PolarRadiusAxis, ResponsiveContainer } from 'recharts';
import { Question, Answers } from '../types';

interface ResultChartProps {
    questions: Question[];
    answers: Answers;
}

export const ResultChart: React.FC<ResultChartProps> = ({ questions, answers }) => {
    const data = questions.map(q => ({
        subject: q.shortTitle,
        A: answers[q.id] || 0,
        fullMark: 5,
    }));

    return (
        <div className="w-full aspect-square max-w-[360px] mx-auto bg-white rounded-3xl p-2 sm:p-4 shadow-xl">
            <ResponsiveContainer width="100%" height="100%">
                {/* outerRadiusを60%に縮小してラベルのスペースを確保 */}
                <RadarChart cx="50%" cy="50%" outerRadius="60%" data={data}>
                    <PolarGrid gridType="polygon" stroke="#e5e7eb" />
                    <PolarAngleAxis 
                        dataKey="subject" 
                        tick={{ fill: '#374151', fontSize: 10, fontWeight: 700 }} 
                    />
                    <PolarRadiusAxis angle={90} domain={[0, 5]} tick={false} axisLine={false} />
                    <Radar
                        name="Nutrition Score"
                        dataKey="A"
                        stroke="#16a34a" 
                        strokeWidth={3}
                        fill="#22c55e"
                        fillOpacity={0.4}
                    />
                </RadarChart>
            </ResponsiveContainer>
        </div>
    );
};