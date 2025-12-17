export interface Option {
    value: number;
    label: string;
}

export interface Question {
    id: number;
    title: string;
    shortTitle: string; // Used for chart labels
    options: Option[];
}

export interface DiagnosisResult {
    totalScore: number;
    rank: 'S' | 'A' | 'B';
    title: string;
    description: string;
    scores: number[]; // Array of scores corresponding to questions 1-5
    advice: string;
}

export type Answers = Record<number, number>;

export interface ConsultationData {
    name: string;
    age: string;
    gender: string;
    email: string;
    livingSituation: string;
    mealCount: string;
    eatingOutFrequency: string;
    medicalHistory: string;
    symptoms: string[]; // Multiple choice
    exerciseHabits: string;
    consultationPurpose: string[]; // Multiple choice
    consultationExperience: string;
    content: string;
}