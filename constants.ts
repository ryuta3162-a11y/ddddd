import { Question } from './types';

export const QUESTIONS: Question[] = [
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

export const CONSULTATION_FORM_URL = "https://forms.gle/oSeyzmDG2f4zfW2HA";

// ★重要★: 
// 以下のURLはGoogle Apps Script (GAS) をデプロイして発行されたWebアプリURLに書き換えてください。
export const GOOGLE_SCRIPT_WEB_APP_URL = "https://script.google.com/macros/s/AKfycbxZemRhV8fb5Vk0rDvsS_UIjECST892akspCUD9ypGqFIFKo7oVJeNC2r5EFLDi5Xe9/exec";