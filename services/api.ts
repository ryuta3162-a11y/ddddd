import { Answers, ConsultationData } from '../types';
import { GOOGLE_SCRIPT_WEB_APP_URL, QUESTIONS } from '../constants';

/**
 * Sends the diagnostic results to a Google Sheet via Google Apps Script.
 */
export const submitResultsToGoogleSheet = async (answers: Answers, freeComment: string) => {
    if (GOOGLE_SCRIPT_WEB_APP_URL.includes("YOUR_GAS_WEB_APP_URL")) {
        console.warn("Google Script URL is not configured. Skipping data submission.");
        return;
    }

    const formData = new FormData();
    formData.append('type', 'diagnosis'); // Identify the type of submission
    formData.append('timestamp', new Date().toISOString());

    QUESTIONS.forEach(q => {
        const val = answers[q.id];
        const label = q.options.find(o => o.value === val)?.label || '';
        formData.append(`Q${q.id}_score`, val.toString());
        formData.append(`Q${q.id}_answer`, label);
    });

    formData.append('free_comment', freeComment);

    try {
        await fetch(GOOGLE_SCRIPT_WEB_APP_URL, {
            method: 'POST',
            body: formData,
            mode: 'no-cors'
        });
    } catch (error) {
        console.error("Failed to submit diagnosis", error);
    }
};

/**
 * Sends the consultation form data to Google Sheet.
 */
export const submitConsultationToGoogleSheet = async (data: ConsultationData) => {
    if (GOOGLE_SCRIPT_WEB_APP_URL.includes("YOUR_GAS_WEB_APP_URL")) {
        console.warn("Google Script URL is not configured. Skipping consultation submission.");
        return;
    }

    const formData = new FormData();
    formData.append('type', 'consultation'); // Identify the type of submission
    formData.append('timestamp', new Date().toISOString());
    
    // Basic Info
    formData.append('name', data.name);
    formData.append('age', data.age);
    formData.append('gender', data.gender);
    formData.append('email', data.email);
    formData.append('livingSituation', data.livingSituation);
    
    // Dietary Habits
    formData.append('mealCount', data.mealCount);
    formData.append('eatingOutFrequency', data.eatingOutFrequency);
    
    // Health & Lifestyle
    formData.append('medicalHistory', data.medicalHistory);
    formData.append('symptoms', data.symptoms.join(', ')); // Join array with comma
    formData.append('exerciseHabits', data.exerciseHabits);
    
    // Consultation Details
    formData.append('consultationPurpose', data.consultationPurpose.join(', ')); // Join array with comma
    formData.append('consultationExperience', data.consultationExperience);
    formData.append('content', data.content);

    try {
        await fetch(GOOGLE_SCRIPT_WEB_APP_URL, {
            method: 'POST',
            body: formData,
            mode: 'no-cors'
        });
    } catch (error) {
        console.error("Failed to submit consultation", error);
        throw error;
    }
};